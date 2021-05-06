/* eslint-disable react/forbid-prop-types */
import React from "react";
import PropTypes from "prop-types";
import { SIZE, spaceY, startY } from "../constants";

export function QuantumGate(props) {
  const { operator, operands } = props;
  if (operator.endsWith("NULL")) {
    return <NULLGate operands={operands} />;
  }
  switch (operator) {
    case "H":
    case "X":
    case "Y":
    case "Z":
    case "M":
      return <SingleQubitGate kind={operator} operands={operands} />;
    case "CNOT":
      return <CNotGate operands={operands} />;
    default:
      return <div />;
  }
}

QuantumGate.propTypes = {
  operands: PropTypes.array.isRequired,
  operator: PropTypes.string.isRequired,
};

function SingleQubitGate(props) {
  const { operands, kind } = props;
  const [operand] = operands;
  const y = operand * spaceY + startY - 10;
  return (
    <g transform={`translate(0, ${y})`}>
      <svg
        viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}
        width={SIZE + 4}
        height={SIZE + 4}
        className="cursor-pointer"
      >
        <rect
          x={0}
          y={0}
          width={SIZE}
          height={SIZE}
          fill="white"
          stroke="black"
          strokeWidth="2"
        />
        <text
          className="select-none"
          x={12}
          y={20}
          fontSize="12px"
          fontWeight="800"
        >
          {kind}
        </text>
      </svg>
    </g>
  );
}

SingleQubitGate.propTypes = {
  operands: PropTypes.array.isRequired,
  kind: PropTypes.string.isRequired,
};

function CNotGate(props) {
  const { operands } = props;
  const [cer, ced] = operands;
  const start = Math.min(cer, ced);
  const end = Math.max(cer, ced);
  const height = end - start;
  return (
    <g transform={`translate(0, ${start * spaceY + startY - 10})`}>
      <svg
        viewBox={`-2 -2 ${SIZE + 4} ${SIZE + height * spaceY + 4}`}
        width={SIZE + 4}
        height={SIZE + height * spaceY + 4}
        className="cursor-pointer"
      >
        <rect
          x={0}
          y={0}
          width={SIZE}
          height={SIZE + height * spaceY}
          fill="white"
          stroke="black"
          strokeWidth="2"
        />
      </svg>
    </g>
  );
}

CNotGate.propTypes = {
  operands: PropTypes.array.isRequired,
};

function NULLGate(props) {
  const { operands } = props;
  const [cer, ced] = operands;
  const start = Math.min(cer, ced);
  const end = Math.max(cer, ced);
  const height = end - start;
  return (
    <g transform={`translate(0, ${start * spaceY + startY - 10})`}>
      <svg
        viewBox={`-2 -2 ${SIZE + 4} ${SIZE + height * spaceY + 4}`}
        width={SIZE + 4}
        height={SIZE + height * spaceY + 4}
        className="cursor-pointer"
      >
        <rect
          x={0}
          y={0}
          width={SIZE}
          height={SIZE + height * spaceY}
          fill="white"
          stroke="black"
          strokeWidth="2"
          strokeDasharray="4"
        />
      </svg>
    </g>
  );
}

NULLGate.propTypes = {
  operands: PropTypes.array.isRequired,
};

export function getArity(operator) {
  const op = operator.substr(0, operator.length - 4);
  if (op === "CNOT") {
    return 2;
  }
  if (op === "TOFFOLI") {
    return 3;
  }
  return 1;
}
