function generateOpenQASM(numQubits, ops) {
  let newCode = 'OPENQASM 2.0;\ninclude "qelib1.inc";\n\n';
  newCode += `qreg q[${numQubits}];\ncreg q[${numQubits}];\n\n`;
  ops.forEach((op) => {
    switch (op.operator) {
      case "CX":
        newCode += `cx q[${op.operands[0]}], q[${op.operands[1]}];\n`;
        break;
      case "M":
        newCode += `measure q[${op.operands[0]}] -> c[${op.operands[0]}];\n`;
        break;
      default:
        newCode += `${op.operator.toLowerCase()} q[${op.operands[0]}];\n`;
    }
  });
  return newCode;
}

function generateQiskit(numQubits, ops) {
  let newCode = `q = QuantumRegister(${numQubits}, 'q')\n`;
  newCode += `c = ClassicalRegister(${numQubits}, 'c')\nqc = QuantumCircuit(q)\n\n`;
  ops.forEach((op) => {
    switch (op.operator) {
      case "CX":
        newCode += `qc.cx(q[${op.operands[0]}], q[${op.operands[1]}])\n`;
        break;
      case "H":
      case "X":
      case "Y":
      case "Z":
        newCode += `qc.${op.operator.toLowerCase()}(q[${op.operands[0]}])\n`;
        break;
      case "M":
        newCode += `qc.measure(q[${op.operands[0]}], c[${op.operands[0]}])\n`;
        break;
      default:
        newCode += `${op.operator.toLowerCase()} q[${op.operands[0]}];\n`;
    }
  });
  return newCode;
}

function generateQuil(_numQubits, ops) {
  let newCode = "";
  ops.forEach((op) => {
    switch (op.operator) {
      case "CX":
        newCode += `CNOT ${op.operands[0]} ${op.operands[1]}\n`;
        break;
      case "H":
      case "X":
      case "Y":
      case "Z":
        newCode += `${op.operator} ${op.operands[0]}\n`;
        break;
      case "M":
        newCode += `MEASURE ${op.operands[0]} [${op.operands[0]}]\n`;
        break;
      default:
        newCode += `${op.operator.toLowerCase()} q[${op.operands[0]}];\n`;
    }
  });
  return newCode;
}

export default function generateCode(
  numQubits,
  ops,
  language = "OPENQASM 2.0"
) {
  switch (language) {
    case "OPENQASM 2.0":
      return generateOpenQASM(numQubits, ops);
    case "Qiskit":
      return generateQiskit(numQubits, ops);
    case "Quil":
      return generateQuil(numQubits, ops);
    default:
      throw new Error();
  }
}
