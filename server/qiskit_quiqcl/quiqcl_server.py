"""QuIQCL server operates real hardwares as clients request."""

import json
import queue
import ssl
import socketserver
import threading
import uuid

from qiskit_quiqcl import protocol
from qiskit_quiqcl import sequencer_operation as seqop
from qiskit_quiqcl import util


class QuiqclRunner:
    """Consumes the job queue, and runs the jobs on real hardwares."""

    def __init__(self, job_queue, job_state, job_state_lock):
        """
        Args:
            See the description of the attributes with the same names
              in QuiqclServer.
        """
        self._job_queue = job_queue
        self._job_state = job_state
        self._job_state_lock = job_state_lock
        self._running = True

    def run(self):
        """For now, just pops and prints out the items in the job queue.
        
        To stop this while loop, call `stop()`.

        Note that `queue.Queue.get()` blocks until there are available items
          when the queue is empty.
        """
        while self._running:
            job_id, job = self._job_queue.get()
            print(f'Running: {job}...')
            with self._job_state_lock:
                target_state = self._job_state[job_id]
                target_state['status'] = 'RUNNING'

            # TODO(kangz12345@gmail.com): check valid backend before running it.
            circuit = job['quiqcl_circuit']
            backend = job['backend']
            try:
                result = seqop.run_quiqcl_circuit(circuit, backend)
            except Exception as e:
                with self._job_state_lock:
                    target_state['status'] = 'ERROR'
                    target_state['error'] = repr(e)
                print(f'Error({repr(e)}) has occurred while running {job}.')
            else:
                with self._job_state_lock:
                    target_state['result'] = result
                    target_state['status'] = 'DONE'

            self._job_queue.task_done()
            print(f'Done: {job}.')

    def stop(self):
        """Stops the running loop in `run()`."""
        self._running = False


class QuiqclRequestHandler(socketserver.BaseRequestHandler):
    """Handles each request for the server.

    Attributes:
        request (inherited): socket.socket which is accepted by the server.
        server (inherited): The server instance.
    """
    
    def handle(self):
        text, payload = protocol.recv_message(self.request)
        if text == 'SUBMIT JOB':
            job_id = uuid.uuid4().hex
            with self.server.job_state_lock:
                self.server.job_state[job_id] = {
                    'status': 'QUEUED',
                    'result': None,
                    'error': None,
                }
            self.server.job_queue.put((job_id, json.loads(payload)))
            protocol.send_message(self.request, 'JOB ID', job_id)
        elif text == 'RETRIEVE JOB':
            job_id = payload
            with self.server.job_state_lock:
                if job_id not in self.server.job_state:
                    raise RuntimeError(f'Tried to retrieve not existing job: '
                                       f'{job_id}.')
                job_info = json.dumps(self.server.job_state[job_id])
            protocol.send_message(self.request, 'JOB INFO', job_info)
        else:
            raise RuntimeError(f'Unknown message: text="{text}", '
                               f'payload="{payload}"')


class QuiqclServer(socketserver.TCPServer):
    """Serves the requests and manages the requested jobs.

    The main thread accepts the requests via SSL, and the runner runs in another
      thread. The server and the runner share the job_queue and job_state.
    The runner thread is daemonic since it could stay blocked even if the server
      is closed or interrupted.

    Attributes:
        job_queue: queue.Queue object which contains ready jobs.
        job_state: A dictionary whose (key, value) is (job_id, job_state_dict),
          where job_state_dict is a dictionary which contains the job status,
          results, etc.
        job_state_lock: threading.Lock object which is used for thread-safe
          management of job_state dictionary.
        runner: QuiqclRunner object which is running the requested jobs
          for the server.
        socket (inherited): Accepted socket.
    """
    
    def __init__(self,
                 server_address,
                 RequestHandlerClass,
                 ssl_context,
                 bind_and_activate=True):
        super().__init__(server_address, RequestHandlerClass, bind_and_activate)
        self._ssl_context = ssl_context

        # TODO(kangz12345@gmail.com): give max_size to prevent memory explosion.
        self.job_queue = queue.Queue()
        self.job_state = dict()
        self.job_state_lock = threading.Lock()
        self.runner = QuiqclRunner(self.job_queue,
                                   self.job_state,
                                   self.job_state_lock)
        self._runner_thread = threading.Thread(target=self.runner.run,
                                               daemon=True)
        self._runner_thread.start()

    def get_request(self):
        """Overriding; Wraps the socket for each request."""
        sock, addr = self.socket.accept()
        ssock = self._ssl_context.wrap_socket(sock, server_side=True)
        return ssock, addr

    @classmethod
    def from_dict(cls, credentials):
        """Returns a new QuiqclServer object with the given credentials dict."""
        server_address = credentials['server_address']
        certfile = credentials['certfile']
        keyfile = credentials['keyfile']
        ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        ssl_context.load_cert_chain(certfile=certfile, keyfile=keyfile)
        return cls(server_address, QuiqclRequestHandler, ssl_context)

    @classmethod
    def from_file(cls, credentials_path):
        """Returns a new QuiqclServer object with the given credentials file."""
        credentials = util.load_credentials(credentials_path)
        return cls.from_dict(credentials)


if __name__ == '__main__':
    server = QuiqclServer.from_file('server_credentials.json')
    server.serve_forever()
