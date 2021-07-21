import sys

import qiskit


def run(circuit, type='qasm2'):
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

    backend = qiskit.BasicAer.get_backend('qasm_simulator')
    result = qiskit.execute(qc, backend, shots=1000).result()
    counts = result.get_counts(qc)

    return counts