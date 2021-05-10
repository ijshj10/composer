/* eslint-disable react/forbid-prop-types */
import React from "react";
import PropTypes from "prop-types";
import { SIZE, SPACE_Y, START_Y } from "../constants";

export function QuantumGate(props) {
  const {
    operator,
    operands,
    handleMouseDown,
    gates,
    setGates,
    id,
    left,
    top,
  } = props;
  if (operator.endsWith("NULL")) {
    return <NULLGate operands={operands} />;
  }
  switch (operator) {
    case "H":
    case "X":
    case "Y":
    case "Z":
    case "M":
      return (
        <SingleQubitGate
          kind={operator}
          operands={operands}
          handleMouseDown={handleMouseDown}
        />
      );
    case "CNOT":
      return (
        <CNotGate
          operands={operands}
          handleMouseDown={handleMouseDown}
          gates={gates}
          setGates={setGates}
          id={id}
          top={top}
        />
      );
    default:
      return <div />;
  }
}

QuantumGate.propTypes = {
  id: PropTypes.number.isRequired,
  gates: PropTypes.array.isRequired,
  setGates: PropTypes.func.isRequired,
  operands: PropTypes.array.isRequired,
  operator: PropTypes.string.isRequired,
  handleMouseDown: PropTypes.func.isRequired,
  left: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
};

function SingleQubitGate(props) {
  const { operands, kind, handleMouseDown } = props;
  const [operand] = operands;
  const y = operand * SPACE_Y + START_Y - 10;
  return (
    <g transform={`translate(0, ${y})`}>
      <svg
        viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}
        width={SIZE + 4}
        height={SIZE + 4}
        className="cursor-pointer"
        onMouseDown={(event) => handleMouseDown(kind, event.pageX, event.pageY)}
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
  handleMouseDown: PropTypes.func.isRequired,
};

function CNotGate(props) {
  const { operands, gates, setGates, id, top } = props;
  let [cer, ced] = operands;
  const start = Math.min(cer, ced);
  const end = Math.max(cer, ced);
  const height = end - start;
  if (cer > ced) {
    cer = height;
    ced = 0;
  } else {
    cer = 0;
    ced = height;
  }

  return (
    <g transform={`translate(0, ${start * SPACE_Y + START_Y - 10})`}>
      <svg
        viewBox={`-2 -2 ${SIZE + 4} ${SIZE + height * SPACE_Y + 4}`}
        width={SIZE + 4}
        height={SIZE + height * SPACE_Y + 4}
        className="cursor-pointer"
        onMouseDown={(event) =>
          props.handleMouseDown("CNOT", event.pageX, event.pageY)
        }
      >
        <rect
          x={0}
          y={0}
          width={SIZE}
          height={SIZE + height * SPACE_Y}
          fill="none"
          stroke="none"
          strokeWidth="2"
          pointerEvents="all"
        />
        <g>
          <svg
            onMouseDown={(event) => {
              const handleMouseMove = (e) => {
                const y = e.clientY - top;
                const i = Math.ceil(
                  Math.max(y - START_Y - SPACE_Y / 2, 0) / SPACE_Y
                );

                setGates(
                  gates.map((gate) => {
                    if (gate.key !== id) return gate;
                    return { ...gate, operands: [i, gate.operands[1]] };
                  })
                );
              };
              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };
              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
              event.stopPropagation();
            }}
          >
            <circle r={5} cx={SIZE / 2} cy={cer * SPACE_Y + SIZE / 2 - 3} />
            <circle
              className="hover:opacity-100 opacity-0"
              r={6}
              cx={SIZE / 2}
              cy={cer * SPACE_Y + SIZE / 2 - 3}
              stroke="red"
            />
          </svg>
        </g>
        <circle
          r={SIZE / 3}
          cx={SIZE / 2}
          cy={ced * SPACE_Y + SIZE / 2 - 3}
          fill="white"
          stroke="black"
        />
        <line
          x1={SIZE / 2}
          y1={cer * SPACE_Y + SIZE / 2 - 3}
          x2={SIZE / 2}
          y2={ced * SPACE_Y + SIZE - 10}
          strokeWidth="1"
          stroke="black"
        />
        <line
          x1={SIZE / 2}
          y1={ced * SPACE_Y + 3}
          x2={SIZE / 2}
          y2={ced * SPACE_Y + SIZE - 10}
          strokeWidth="1"
          stroke="black"
        />
        <line
          x1={SIZE / 6}
          x2={(SIZE * 5) / 6}
          y1={ced * SPACE_Y + SIZE / 2 - 3}
          y2={ced * SPACE_Y + SIZE / 2 - 3}
          strokeWidth="1"
          stroke="black"
        />
      </svg>
    </g>
  );
}

CNotGate.propTypes = {
  gates: PropTypes.array.isRequired,
  setGates: PropTypes.func.isRequired,
  operands: PropTypes.array.isRequired,
  handleMouseDown: PropTypes.func.isRequired,
  id: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
};

function NULLGate(props) {
  const { operands } = props;
  const [cer, ced] = operands;
  const start = Math.min(cer, ced);
  const end = Math.max(cer, ced);
  const height = end - start;
  return (
    <g transform={`translate(0, ${start * SPACE_Y + START_Y - 10})`}>
      <svg
        viewBox={`-2 -2 ${SIZE + 4} ${SIZE + height * SPACE_Y + 4}`}
        width={SIZE + 4}
        height={SIZE + height * SPACE_Y + 4}
        className="cursor-pointer"
      >
        <rect
          x={0}
          y={0}
          width={SIZE}
          height={SIZE + height * SPACE_Y}
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
