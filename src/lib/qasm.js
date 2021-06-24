import QuantumCircuit from "quantum-circuit";

export default function parse(code, errorCallback) {
  const qc = new QuantumCircuit();
  qc.importQASM(code, errorCallback);
  return qc;
}
