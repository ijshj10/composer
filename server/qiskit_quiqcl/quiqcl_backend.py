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

import warnings

import requests
import uuid
import json

from datetime import datetime

from qiskit import qobj
from qiskit import providers
from qiskit.providers.models import BackendConfiguration
from qiskit.exceptions import QiskitError
from qiskit.util import deprecate_arguments

from qiskit_quiqcl import quiqcl_job
from qiskit_quiqcl import util


class QuiqclDevice(providers.BackendV1):

    @classmethod
    def _default_options(cls):
        return providers.Options(shots=100)

    @deprecate_arguments({'qobj': 'circuit'})
    def run(self, circuit, **kwargs):
        if isinstance(circuit, qobj.QasmQobj):
            warnings.warn("Passing in a QASMQobj object to run() is "
                          "deprecated and will be removed in a future "
                          "release", DeprecationWarning)
            if circuit.config.shots > self.configuration().max_shots:
                raise ValueError('Number of shots is larger than maximum '
                                 'number of shots')
            quiqcl_circuit = util.qobj_to_quiqcl(circuit)
        elif isinstance(circuit, qobj.PulseQobj):
            raise QiskitError("Pulse jobs are not accepted")
        else:
            for kwarg in kwargs:
                if kwarg != 'shots':
                    warnings.warn(
                        "Option %s is not used by this backend" % kwarg,
                        UserWarning, stacklevel=2)
            out_shots = kwargs.get('shots', self.options.shots)
            if out_shots > self.configuration().max_shots:
                raise ValueError('Number of shots is larger than maximum '
                                 'number of shots')
            quiqcl_circuit = util.circuit_to_quiqcl(circuit, shots=out_shots)

        job = quiqcl_job.QuiqclJob(backend=self, 
                                   job_id=None,
                                   client=self.provider().client,
                                   circuit=quiqcl_circuit)
        job.submit()
        return job


class QuiqclChipTrapDevice(QuiqclDevice):

    def __init__(self, provider):
        # check QasmBackendConfiguration.__init__()
        configuration = {
            'backend_name': 'quiqcl_chip_trap',
            'backend_version': '0.0.1',
            'simulator': False,
            'local': False,
            'coupling_map': None,
            'description': 'Quiqcl trapped-ion device(chip trap)',
            'basis_gates': ['id', 'rx', 'ry', 'rxx', 'ms'],  # include 'id'?
            'memory': False,
            'n_qubits': 1,
            'conditional': False,
            'max_shots': 1024,  # any better value?
            'max_experiments': 1,
            'open_pulse': False,
            'gates': [
                {
                    'name': 'TODO',
                    'parameters': [],
                    'qasm_def': 'TODO'
                }
            ]
        }
        super().__init__(
            configuration=BackendConfiguration.from_dict(configuration),
            provider=provider)


class QuiqclBladeTrapDevice(QuiqclDevice):

    def __init__(self, provider):
        # check QasmBackendConfiguration.__init__()
        configuration = {
            'backend_name': 'quiqcl_blade_trap',
            'backend_version': '0.0.1',
            'simulator': False,
            'local': False,
            'coupling_map': None,
            'description': 'Quiqcl trapped-ion device(blade trap)',
            'basis_gates': ['id', 'rx', 'ry', 'rxx', 'ms'],  # include 'id'?
            'memory': False,
            'n_qubits': 1,
            'conditional': False,
            'max_shots': 1024,  # any better value?
            'max_experiments': 1,
            'open_pulse': False,
            'gates': [
                {
                    'name': 'TODO',
                    'parameters': [],
                    'qasm_def': 'TODO'
                }
            ]
        }
        super().__init__(
            configuration=BackendConfiguration.from_dict(configuration),
            provider=provider)
