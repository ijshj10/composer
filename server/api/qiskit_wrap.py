import sys

import qiskit
from qiskit.providers import jobstatus

from qiskit_quiqcl import quiqcl_provider as provider


def run_sim(circuit, type='qasm2'):
    qc = _convert_circuit(circuit)

    backend = qiskit.BasicAer.get_backend('qasm_simulator')
    job = qiskit.execute(qc, backend, shots=1000)

    return job


def run_blade_trap(circuit, type='qasm2'):
    qc = _convert_circuit(circuit)

    quiqcl = provider.QuiqclProvider.from_file('blade_credentials.json')
    backend = quiqcl.backends.quiqcl_blade_trap
    job = qiskit.execute(qc, backend, shots=1000)

    return job


def update_status(experiment, job):
    if job.status() in jobstatus.JOB_FINAL_STATES:
        result = job.result()
        if result is None:
            experiment["result"] = {'0': 0, '1': 0}
            experiment["error"] = job.error()
        else:
            experiment["result"] = result.get_counts()
        experiment["done"] = True
    print(experiment, file=sys.stderr)


def _convert_circuit(circuit):
    numQubits = circuit['numQubits']
    qc = qiskit.QuantumCircuit(numQubits, numQubits)
    print(circuit, file=sys.stderr)

    for op in circuit["ops"]:
        if op['operator'] == 'H':
            qc.h(op['operands'][0])
        elif op['operator'] == 'X':
            qc.x(op['operands'][0])
        elif op['operator'] == 'Y':
            qc.y(op['operands'][0])
        elif op['operator'] == 'X':
            qc.z(op['operands'][0])

    for i in range(numQubits):
        qc.measure(i, i)

    return qc
