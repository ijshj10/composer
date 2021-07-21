# -*- coding: utf-8 -*-

# This code is part of Qiskit.
#
# (C) Copyright IBM 2019.
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.

# pylint: disable=protected-access

import time
import os
import sys

import requests
import json
import threading

import qiskit
import qiskit.result
from qiskit import providers
from qiskit.providers import jobstatus
from qiskit import qobj

from qiskit_quiqcl import quiqcl_client as qclient
from qiskit_quiqcl import util


class QuiqclJob(providers.JobV1):
    """Job that will run on QuIQCL backends.
    
    Note that `self.backend() and self.job_id()` are inherited.
    Moreover, the protected attribute `self._job_id` is also inherited.

    Attributes:
        circuit: A quiqcl-circuit data structure which represents the circuit
          to be run.
    """

    def __init__(self, backend, job_id, client, circuit=None):
        """Initialize a job instance.

        Parameters:
            backend (BaseBackend): Backend that job was executed on.
            job_id (str): The unique job ID.
            client: qclient.QuiqclClient instance.
            circuit: Quantum object, if any.
        """
        super().__init__(backend, job_id)
        if isinstance(circuit, qobj.QasmQobj):
            self.circuit = util.qobj_to_quiqcl(circuit, None)
        elif isinstance(circuit, qiskit.QuantumCircuit):
            self.circuit = util.circuit_to_quiqcl(circuit, None)
        else:
            self.circuit = circuit
        self._client = client
        self._result = None
        self._status = jobstatus.JobStatus.INITIALIZING

    def result(self):
        """Gets the result data of the circuit."""
        if self.job_id() is None:
            raise RuntimeError('This job is not submitted yet.')

        self.wait_for_final_state()  # inherited method
        return self._result

    def error(self):
        """Gets the error message."""
        if self.job_id() is None:
            raise RuntimeError('This job is not submitted yet.')

        self.wait_for_final_state()  # inherited method
        return self._error

    def get_counts(self):
        """Get the histogram data of a measured circuit.

        Returns:
            dict: Dictionary of string : int key-value pairs.
        """
        return self.result().get_counts()

    def cancel(self):
        # if os.path.exists(self.job_file_name):
        #     os.remove(self.job_file_name)
        pass

    def status(self):
        """Overriding; Retrives the status of the job.
        
        This sends an actual query to the server only when the job is queued
          and its result has not been fetched yet.
        Before returning the status, it chaches the retrieved job status in
          self._status. Moreover, when the current status is one of the final
          states, it caches the result as well.

        TODO(kangz12345@gmail.com): cancellation/error handling.
        """
        # If the job is not queued or already done, return it right away.
        if self.job_id() is None:
            return self._status
        if self.job_id() in jobstatus.JOB_FINAL_STATES:
            return self._status

        # Othrewise, queries the server to get the current status.
        job_state = self._client.retrieve_job(self.job_id())
        self._status = jobstatus.JobStatus[job_state['status']]
        if self._status in jobstatus.JOB_FINAL_STATES:
            self._result = job_state['result']
            if self._result is not None:
                self._result = self._format_result(self._result)
            self._error = job_state['error']

        return self._status

    def submit(self):
        """Overriding; Submits the job to the server.
        
        Raises:
            RuntimeError: When the job cannot be submitted i.e. it already has
              its job_id or it does not have any circuit information.

        Returns:
            The newly assigned job_id of the submited job.
        """
        if self.job_id() is not None:
            raise RuntimeError(f'This job has already been submitted and its'
                               f'job_id is {self.job_id()}.')
        if self.circuit is None:
            raise RuntimeError('This job does not have a circuit information.')

        self._job_id = self._client.submit_job(job=self)
        return self.job_id()

    def _format_counts(self, samples):
        """Returns the formatted counts dict from the sample list.

        For now, it assumes the 1-qubit circuit.
        TODO(kangz12345@gmail.com): devise a way to implement for n-qubit.
        """
        counts = {}
        for sample in map(str, samples):
            if sample in counts:
                counts[sample] += 1
            else:
                counts[sample] = 1

        return counts

    def _format_result(self, result):
        """Returns a Result object from the internal result data structure.

        For now, it assumes the 1-qubit circuit.
        TODO(kangz12345@gmail.com): devise a way to implement for n-qubit.
        """
        samples = result['samples']
        results = [{
            'success': True,
            'shots': len(samples),
            'data': {'counts': self._format_counts(samples)},
            'header': {'memory_slots': 1,  # TODO(kangz12345@gmail.com): temp.
                       'name': 'quiqcl_circuit'}
        }]

        return qiskit.result.Result.from_dict({
            'results': results,
            'backend_name': self.backend().configuration().backend_name,
            'backend_version': self.backend().configuration().backend_version,
            'qobj_id': id(self.circuit),
            'success': True,
            'job_id': self.job_id(),
        })
