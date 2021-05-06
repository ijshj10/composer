/* eslint-disable no-use-before-define */
/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { GATES, START_X, START_Y, SPACE_X, SPACE_Y } from "../constants";
import { Sidebar } from "./sidebar";
import useDimension from "../hooks/useDimension";
import { QuantumGate, getArity } from "./gates";
import Editor from "./editor";

export default function Composer() {
  const [clicked, setClicked] = useState(null);

  const handleDrag = (kind, x, y) => {
    setClicked({ kind: `${kind}NULL`, x, y });
    const handleMouseMove = (event) => {
      setClicked({ kind: `${kind}NULL`, x: event.pageX, y: event.pageY });
    };
    const handleDrop = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleDrop);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleDrop);
  };

  const [circuit, setCiruit] = useState({
    qubitKeys: [0, 1, 2],
    ops: [],
  });

  const [code, setCode] = useState('OPENQASM 2.0;\ninclude "qelib1.inc"\n');

  useEffect(() => {
    let newCode = 'OPENQASM 2.0;\ninclude "qelib1.inc"\n';
    newCode += `\nqreg q[${circuit.qubitKeys.length}];\ncreg c[${circuit.qubitKeys.length}];\n\n`;
    circuit.ops.forEach(({ operator, operands }) => {
      if (operator === "CNOT")
        newCode += `cx q[${operands[0]}] q[${operands[1]}];\n`;
      else if (operator === "M")
        newCode += `measure q[${operands[0]}] -> c[${operands[0]}];\n`;
      else newCode += `${operator.toLowerCase()} q[${operands[0]}];\n`;
    });
    setCode(newCode);
  }, [circuit]);

  useEffect(() => {
    const lines = code.split("\n");

    let newCircuit;
    try {
      const qubits = Number(
        /\d+/.exec(lines.find((line) => line.startsWith("qreg")))
      );

      newCircuit = {
        qubitKeys: [...Array(qubits).keys()],
        ops: [],
      };
      // setCiruit(newCircuit);
    } catch (error) {
      console.log(error);
    }
  }, [code]);

  /* const [result, setResult] = useState(null);
   */

  return (
    <>
      {clicked !== null && (
        <div
          className="absolute gate"
          style={{
            top: clicked.y - 24,
            left: clicked.x - 24,
          }}
        >
          {clicked.kind[0]}
        </div>
      )}
      <div className="flex flex-row flex-grow">
        <Sidebar />
        <div className="flex flex-col space-y-0 flex-grow">
          <Menu />
          <Title />
          <div className="flex flex-row flex-grow">
            <div className="flex flex-col border-r-2 flex-grow">
              <GatePannel handleDrag={handleDrag} />
              <Circuit
                circuit={circuit}
                setCiruit={setCiruit}
                clicked={clicked}
                setClicked={setClicked}
                handleDrag={handleDrag}
              />
            </div>
            <div className="w-2/6 ml-4 overflow-auto">
              <Editor code={code} setCode={setCode} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Circuit(props) {
  const { circuit, setCiruit, clicked, setClicked } = props;
  const [dimension, ref] = useDimension();

  const { qubitKeys, ops } = circuit;

  const addQubit = () => {
    setCiruit({
      qubitKeys: qubitKeys.concat([qubitKeys.length]),
      ops,
    });
  };

  const deleteQubit = (index) => {
    setCiruit({
      qubitKeys: qubitKeys.slice(0, -1),
      ops: ops
        .filter((op) => !op.operands.includes(index))
        .map((op) => {
          const fixedOperands = op.operands.map((operand) => {
            if (operand < index) return operand;
            return operand - 1;
          });
          return { ...op, operands: fixedOperands };
        }),
    });
  };

  const handleDrop = () => {
    if (clicked === null) return;
    const opRendered = renderOps(ops);
    setCiruit({
      ...circuit,
      ops: opRendered.map(({ operator, operands, key }) => {
        if (key !== 0) return { operator, operands, key };
        return {
          operator: operator.substr(0, operator.length - 4),
          operands,
          key: opKeyGenerator(),
        };
      }),
    });
    setClicked(null);
  };

  const handleDrag = (key, kind, x, y) => {
    setCiruit({ ...circuit, ops: ops.filter((op) => op.key !== key) });
    props.handleDrag(kind, x, y);
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleDrop);
    return () => document.removeEventListener("mouseup", handleDrop);
  });

  const { width, height } = dimension;

  const renderOps = (operations) => {
    const nextX = Array(qubitKeys.length).fill(0);
    // First sort gate for drop implementation
    let opRendered = [];
    operations.forEach((op) => {
      const { operands } = op;
      const minOperand = Math.min(...operands);
      const maxOperand = Math.max(...operands);
      let drawX = 0;
      for (let i = minOperand; i <= maxOperand; i += 1) {
        drawX = Math.max(drawX, nextX[i]);
      }

      for (let i = minOperand; i <= maxOperand; i += 1) {
        nextX[i] = drawX + 1;
      }
      opRendered.push({ ...op, drawX });
    });
    opRendered.sort((gate1, gate2) => gate1.drawX - gate2.drawX);

    let dropI = null;
    let dropJ = null;

    let dropRendered = true;
    if (clicked) {
      let { x, y } = clicked;
      y -= dimension.top;
      x -= dimension.left;
      const airity = getArity(clicked.kind);
      if (y >= 0) {
        dropI = Math.ceil(Math.max(y - START_Y - SPACE_Y / 2, 0) / SPACE_Y);
      }
      if (dropI !== null && dropI + airity <= qubitKeys.length) {
        dropJ = Math.ceil(Math.max(x - START_X - SPACE_X / 2, 0) / SPACE_X);
      }
      if (dropJ !== null) dropRendered = false;
    }

    // Insert drop point
    const opAndDropRendered = [];
    if (!dropRendered) {
      nextX.fill(0);
      const airity = getArity(clicked.kind);

      opRendered.forEach((op) => {
        const { operands } = op;
        const minOperand = Math.min(...operands);
        const maxOperand = Math.max(...operands);

        let drawX = 0;

        for (let i = minOperand; i <= maxOperand; i += 1) {
          drawX = Math.max(drawX, nextX[i]);
        }
        if (
          !dropRendered &&
          drawX >= dropJ &&
          minOperand <= dropI + airity - 1 &&
          dropI <= maxOperand
        ) {
          let dropX = 0;
          for (let i = dropI; i < dropI + airity; i += 1) {
            dropX = Math.max(dropX, nextX[i]);
          }

          opAndDropRendered.push({
            operator: clicked.kind,
            operands: [dropI, dropI + airity - 1],
            key: 0,
            drawX: dropX,
          });
          dropRendered = true;
          for (let i = dropI; i < dropI + airity; i += 1) {
            nextX[i] = dropX + 1;
          }
          if (dropX === drawX) drawX += 1;
        }

        opAndDropRendered.push({ ...op, drawX });
        for (let i = minOperand; i <= maxOperand; i += 1) {
          nextX[i] = drawX + 1;
        }
      });
      if (!dropRendered) {
        let dropX = 0;
        for (let i = dropI; i < dropI + airity; i += 1) {
          dropX = Math.max(dropX, nextX[i]);
        }
        opAndDropRendered.push({
          operator: clicked.kind,
          operands: [dropI, dropI + airity - 1],
          key: 0,
          drawX: dropX,
        });
      }
      opRendered = opAndDropRendered;
    }
    return opRendered;
  };

  const opRendered = renderOps(ops);

  return (
    <div className="w-full h-1/2 border-b-2 border-t-2 overflow-auto" ref={ref}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {qubitKeys.map((key, index) => {
          const level = START_Y + SPACE_Y * index;
          return (
            <g key={key} transform={`translate(0,${level})`}>
              <g transform="translate(0,-5)">
                <svg
                  className="opacity-30 hover:opacity-100 cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  height="24px"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  onClick={() => deleteQubit(index)}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    stroke="#d32f2f"
                    fill="none"
                    pointerEvents="all"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </g>
              <line
                x1={START_X}
                x2={dimension ? dimension.left + dimension.width : 0}
                y1={5}
                y2={5}
                strokeWidth={0.5}
                stroke="black"
              />
            </g>
          );
        })}
        {opRendered.map(({ key, operator, operands, drawX }) => (
          <g
            key={key}
            transform={`translate(${START_X + 10 + drawX * SPACE_X}, 0)`}
          >
            <QuantumGate
              operator={operator}
              operands={operands}
              handleMouseDown={(kind, x, y) => handleDrag(key, kind, x, y)}
            />
          </g>
        ))}
        <g transform={`translate(0, ${START_Y + qubitKeys.length * SPACE_Y})`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24px"
            height="24px"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="opacity-30 hover:opacity-100 cursor-pointer"
            onClick={() => addQubit()}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              fill="none"
              pointerEvents="all"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </g>
      </svg>
    </div>
  );
}

Circuit.propTypes = {
  circuit: PropTypes.object.isRequired,
  setCiruit: PropTypes.func.isRequired,
  clicked: PropTypes.object,
  setClicked: PropTypes.func.isRequired,
  handleDrag: PropTypes.func.isRequired,
};

Circuit.defaultProps = {
  clicked: null,
};

function GatePannel(props) {
  const { handleDrag } = props;
  return (
    <div className="flex flex-row bo">
      {GATES.map((operator) => (
        <button
          type="button"
          key={operator}
          className="gate"
          onMouseDown={(event) => {
            handleDrag(operator, event.pageX, event.pageY);
          }}
        >
          {operator[0]}
        </button>
      ))}
    </div>
  );
}

GatePannel.propTypes = {
  handleDrag: PropTypes.func.isRequired,
};

function Menu() {
  return (
    <div className="border-b-2 flex flex-row">
      <button type="button" className="menu">
        File
      </button>
      <button type="button" className="menu">
        Edit
      </button>
      <button type="button" className="menu">
        Inspect
      </button>
      <button type="button" className="menu">
        View
      </button>
      <button type="button" className="menu">
        Share
      </button>
      <div />
    </div>
  );
}

function Title() {
  return (
    <form className="border-b-2">
      <input type="text" defaultValue="Untitled circuit" className="p-2" />
    </form>
  );
}

function keyGenGenerator(inital) {
  let count = inital;
  return () => {
    count += 1;
    return count - 1;
  };
}

const qubitKeyGenerator = keyGenGenerator(3);
const opKeyGenerator = keyGenGenerator(1);
