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

"""Basic API for QuIQCL's hardware backends."""
# TODO(kangz12345@gmail.com): access token security

import json
import socket
import ssl

from qiskit_quiqcl import protocol
from qiskit_quiqcl import util


class QuiqclClient:
    """QuIQCL's hardware backend API client."""

    def __init__(self, server_address, server_hostname, cafile, token):
        self._server_address = server_address
        self._server_hostname = server_hostname
        self._ssl_context = ssl.create_default_context(cafile=cafile)
        self._token = token

    def submit_job(self, job):
        """Submits a job to the server and gets the assigned job_id.
        
        Args:
            job: QuiqclJob object to be submitted.

        Raises:
            RuntimeError: When the server's response is invalid.

        Returns:
            New job_id assigned by the server.
        """
        job_info = {
            'quiqcl_circuit': job.circuit,
            'backend': job.backend().name(),
        }
        text, payload = self._query('SUBMIT JOB', json.dumps(job_info))
        if text != 'JOB ID':
            raise RuntimeError(f'Unexpected response: text="{text}", '
                               f'payload="{payload}". Expected text="JOB ID".')
        # payload is job_id.
        return payload

    def retrieve_job(self, job_id):
        """Retrieves the job status and result with the given id.

        Args:
            job_id: The job_id of the target job.

        Raises:
            RuntimeError: When the server's response is invalid.

        Returns:
            dict whose keys are 'status', 'result', etc.
        """
        text, payload = self._query('RETRIEVE JOB', job_id)
        if text != 'JOB INFO':
            raise RuntimeError(f'Unexpected response: text="{text}", payload='
                               f'"{payload}". Expected text="JOB INFO".')
        # payloads is json-dumped dict.
        return json.loads(payload)

    def _query(self, text, payload=None):
        """Sends a message to the server and returns its response.

        This creates a secure TCP connection. It might raise some errors
          when something goes wrong with SSL certificates or authentication.

        Args:
            See the args of `qiskit_quiqcl.protocol.send_message()`.
            Invalid text or payload may occur a RuntimeError.

        Raises:
            RuntimeError: When the server's response is invalid.

        Returns:
            Response text, response payload. When there is no response payload,
              it is None.
        """
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            with self._ssl_context.wrap_socket(
                sock, server_hostname=self._server_hostname
            ) as ssock:
                ssock.connect(self._server_address)
                protocol.send_message(ssock, text, payload)
                response = protocol.recv_message(ssock)
        return response

    @classmethod
    def from_dict(cls, credentials):
        """Returns a new QuiqclClient object with the given credentials dict."""
        server_address = credentials['server_address']
        server_hostname = credentials['server_hostname']
        cafile = credentials['cafile']
        token = credentials['token']
        return cls(server_address, server_hostname, cafile, token)

    @classmethod
    def from_file(cls, credentials_path):
        """Returns a new QuiqclClient object with the given credentials file."""
        credentials = util.load_credentials(credentials_path)
        return cls.from_dict(credentials)
