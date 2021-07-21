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

import json

from qiskit import converters


def _circuit_preprocess(circuit):
    """Converts a QuantumCircuit to a list of operation layers.
    
    Args:
        circuit: qiskit.QuantumCircuit object.

    Raises:
        ValueError:
          There is an operation outside of the basis operation set, or the
            circuit does not include any measurement.

    Returns:
        list[list[dict]]:
          The inner-most dictionary represents each operation, and the
            middle-level list represents each 'layer' which can be done in
            parallel. The outer-most list contains the layers in order.
    """
    dag = converters.circuit_to_dag(circuit)
    n_measures = 0
    layers = []
    for dag_layer in dag.layers():
        layer = []
        for node in dag_layer['graph'].op_nodes():
            if node.name not in ['id', 'rx', 'ry', 'rxx', 'measure', 'barrier']:
                raise ValueError(f'Operation {node.name} outside of basis:'
                                 f'id, rx, ry, rxx')
            if node.name == 'measure':
                n_measures += 1
            layer.append({
                'op': node.name, 
                'params': node.op.params, 
                'qargs': [circuit.qubits.index(qubit) for qubit in node.qargs], 
                'cargs': [circuit.clbits.index(clbit) for clbit in node.cargs],
            })
        layers.append(layer)

    if not n_measures >= 1:
        raise ValueError(f'Circuit must have at least one measurements, '
                         f'but {n_measures} are given.')

    return layers


def circuit_to_quiqcl(circuits, shots=100):
    """
    TODO(kangz12345@gmail.com): docstring style
    Returns a dictionary of the following key-value pairs that represents the circuit
        "circuit": list of layers. each layer is a list of operations.
                   each operation is represented as a dictionary
        "shots": number of shots
        "num_qubits": number of qubits in the circuit

    Operation as a dictionary with the following key-value pairs
        "op": name of operations. 
              It is expected that only the transpiled circuit is passed to this method,
              and therefore only the possible op's are 'rx', 'ry', 'rxx', 'measure', 'barrier'
        "params": a list of parameters required for each operation
            'rx', 'ry', 'rxx': a list with a single element,
                               the rotation angle in a bloch sphere
                               ex) 'rx' with params [PI] == X gate
            'measure', 'barrier': an empty list []
        "qargs": a list of qubit indices that the operation is done on.
        "cargs": a list of clbit indices that the operation is done on.
    """
    if isinstance(circuits, list):
        if len(circuits) > 1:
            raise ValueError(f'Multiple circuit conversion is not allowed, '
                             f'but {len(circuits)} are given.')
        circuits = circuits[0]

    return {
        'circuit': _circuit_preprocess(circuits),
        'shots': shots,
        'num_qubits': circuits.num_qubits,
    }


def _qobj_preprocess(experiment):
    """TODO(kangz12345@gmail.com): docstring style
    just made to return the same format for circuit datatype
    """
    layers = []
    n_measures = 0
    for inst in experiment.instructions:
        if inst.name not in ['id', 'rx', 'ry', 'rxx', 'measure', 'barrier']:
            raise ValueError(f'Operation {inst.name} outside of basis id, rx, ry, rxx')
        layers.append([{
            'op': inst.name, 
            'params': [inst.params[0]], 
            'qargs': inst.qubits, 
            'cargs': []
        }])

    if not n_measures >= 1:
        raise ValueError(f'Circuit must have at least one measurements, '
                         f'but {n_measures} are given.')
    return layers


def qobj_to_quiqcl(qobj):
    """TODO(kangz12345@gmail.com): docstring style
    Please note that this function is only defined to be consistant with the circuit-version method

    Returns a dictionary of the following key-value pairs that represents the qobj
        "circuit": list of layers. each layer is a list of operations.
                   each operation is represented as a dictionary
        "shots": number of shots
        "num_qubits": number of qubits in the circuit

    Operation as a dictionary with the following key-value pairs
        "op": name of operations. 
              It is expected that only the transpiled circuit is passed to this method,
              and therefore only the possible op's are 'rx', 'ry', 'rxx', 'measure', 'barrier'
        "params": a list of parameters required for each operation
            'rx', 'ry', 'rxx': a list with a single element,
                               the rotation angle in a bloch sphere
                               ex) 'rx' with params [PI] == X gate
            'measure', 'barrier': an empty list []
        "qargs": a list of qubit indices that the operation is done on.
        "cargs": a list of clbit indices that the operation is done on.
    """
    if len(qobj.experiments) > 1:
        raise ValueError(f'Qobj should contain only one experiment, but '
                         f'{len(qobj.experiments)} are given.')

    circuit = list(map(_qobj_preprocess, qobj.experiments))

    return {
        'circuit': circuit,
        'shots': qobj.config.shots,
        'num_qubits': qobj.config.n_qubits,
    }


def load_credentials(path):
    """Returns a credentials dict by reading the given json file."""
    with open(path, 'r') as f:
        credentials = json.load(f)
    # JSON file cannot represent tuples.
    credentials['server_address'] = tuple(credentials['server_address'])
    return credentials
