import QuantumCircuit from "quantum-circuit";

export default function run(code, errorCallback) {
  const qc = new QuantumCircuit();
  qc.importQASM(code, errorCallback);
  qc.run();
  return qc.measureAllMultishot(1024);
}
