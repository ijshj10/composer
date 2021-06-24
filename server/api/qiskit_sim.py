from qiskit import *
from qiskit.visualization import plot_histogram
from qiskit.tools.monitor import job_monitor
from qiskit.qasm import OpenQASMLexer
import matplotlib.pyplot as plt
import base64


def run(circuit, type='qasm2'):
    qc = QuantumCircuit(len(circuit["qubitKeys"]))

    for op in circuit["ops"]:
        if op["operation"] == "CNOT":
            qc.cx(op["operands"][0], op["operands"][1])
        elif op["operation"] == "H":
            qc.h(op['operands'][0])

    backend = BasicAer.get_backend('qasm_simulator')
    result = execute(qc, backend, shots=1000).result()
    counts = result.get_counts(qc)
    plot_histogram(counts)
    plt.savefig('temp.png')
    plt.close()
    with open('temp.png', 'rb') as image_file:
        encoded = base64.encodebytes(image_file.read())
        return encoded
