/* eslint-disable no-use-before-define */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { START_X, START_Y, SPACE_X, SPACE_Y } from "../constants";
import useDimension from "../hooks/useDimension";
import { getArity, QuantumGate } from "./gates";
import GatePanel from "./GatePanel";

export default function CircuitContainer(props) {
  const { ops, setOps, numQubits, setNumQubits } = props;
  const [dimension, ref] = useDimension();

  /*
  const handleDrag = (op, x, y) => {
    setDragged({ op, x, y });
    const handleMouseMove = (event) => {
      setDragged({
        op,
        x: event.pageX,
        y: event.pageY,
      });
    };
    const handleDrop = () => {
      setDragged(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleDrop);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleDrop);
  };
  */

  const [dragged, setDragged] = useState(null);

  const addQubit = () => {
    setNumQubits(numQubits + 1);
  };

  const deleteQubit = (index) => {
    const newOps = ops
      .filter((op) => !op.operands.includes(index)) // remove operation involving deleted qubit
      .map(({ operator, operands }) => ({
        operator,
        operands: operands.map((operand) =>
          operand > index ? operand - 1 : operand
        ),
      }));
    setOps(newOps);
    setNumQubits(numQubits - 1);
  };

  const handleDrop = () => {
    if (dragged === null) return;
    const opRendered = renderOps(ops, dragged, numQubits, dimension);
    setOps(
      opRendered.map(({ operator, operands, key }) => {
        if (key !== 0) return { operator, operands, key };
        return {
          operator,
          operands,
          key: opKeyGenerator(),
        };
      })
    );
  };

  const setDragged;

  useEffect(() => {
    document.addEventListener("mouseup", handleDrop);
    return () => document.removeEventListener("mouseup", handleDrop);
  });

  const handleDrag = (key, operation, x, y) => {
    props.handleDrag(operation, x, y);
    setOps(ops.filter((op) => op.key !== key));
  };

  const { width, height } = dimension;

  const opRendered = renderOps(ops, dragged, numQubits, dimension);

  return (
    <div className="w-full overflow-auto" ref={ref}>
      <div className="border-b-2 py-1">
        <GatePanel onMouseDown={handleClick} />
      </div>
      <svg
        width={width}
        height={Math.max(height - 4, 3 * START_X + SPACE_X * numQubits)}
        viewBox={`0 0 ${width} ${Math.max(
          height - 4,
          2 * START_Y + SPACE_Y * numQubits
        )}`}
      >
        {[...Array(numQubits).keys()].map((key) => {
          const level = START_Y + SPACE_Y * key;
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
                  onClick={() => deleteQubit(key)}
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
              gates={ops}
              setGates={setOps}
              id={key}
              left={dimension.left}
              top={dimension.top}
              numQubits={numQubits}
            />
          </g>
        ))}
        <g transform={`translate(0, ${START_Y + numQubits * SPACE_Y})`}>
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

function renderOps(ops, dragged, numQubits, dimension) {
  const nextX = Array(numQubits).fill(0);
  // First sort gate for drop implementation
  let opRendered = [];
  ops.forEach((op) => {
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
  if (dragged) {
    let { x, y } = dragged;
    const { op } = dragged;
    y -= dimension.top;
    x -= dimension.left;

    const airity = Math.max(...op.operands) - Math.min(...op.operands) + 1;
    if (y >= 0) {
      dropI = Math.ceil(Math.max(y - START_Y - SPACE_Y / 2, 0) / SPACE_Y);
    }
    if (dropI !== null && dropI + airity <= numQubits) {
      dropJ = Math.ceil(Math.max(x - START_X - SPACE_X / 2, 0) / SPACE_X);
    }
    if (dropJ !== null) dropRendered = false;
  }

  // Insert drop point
  const opAndDropRendered = [];
  if (!dropRendered) {
    nextX.fill(0);
    const airity = getArity(dragged.op.operator);

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
          operator: dragged.op.operator,
          operands: dragged.op.operands.map((operand) => operand + dropI),
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
        operator: dragged.op.operator,
        operands: dragged.op.operands.map((operand) => operand + dropI),
        key: 0,
        drawX: dropX,
      });
    }
    opRendered = opAndDropRendered;
  }
  return opRendered;
}

const opKeyGenerator = keyGenerator(1);

function keyGenerator(initialKey) {
  let key = initialKey;
  return () => {
    key += 1;
    return key - 1;
  };
}
