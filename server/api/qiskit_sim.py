from qiskit import *
from qiskit.visualization import plot_histogram
from qiskit.tools.monitor import job_monitor
import matplotlib.pyplot as plt
import base64


def run(gates):
    qc = QuantumCircuit(len(gates), len(gates))
    maxLen = len(max(gates, key=len))
    for j in range(maxLen):
        for (i, qubit) in enumerate(gates):
            if j < len(qubit):
                if qubit[j] == 'H':
                    qc.h(i)
                elif qubit[j] == 'X':
                    qc.x(i)
                elif qubit[j] == 'Y':
                    qc.y(i)
                elif qubit[j] == 'Z':
                    qc.z(i)
                elif qubit[j] == 'M':
                    qc.measure([i], [i])

    backend = BasicAer.get_backend('qasm_simulator')
    result = execute(qc, backend, shots=1000).result()
    counts = result.get_counts(qc)
    plot_histogram(counts)
    plt.savefig('temp.png')
    plt.close()
    with open('temp.png', 'rb') as image_file:
        encoded = base64.encodebytes(image_file.read())
        return encoded
