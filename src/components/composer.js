/* eslint-disable no-use-before-define */
/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { GATES } from "../constants";
import { getArity } from "./gates";
import Sidebar from "./sidebar";
import Circuit from "./circuit";

export default function Composer() {
  const [dragged, setDragged] = useState(null);

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

  const [numQubits, setNumQubits] = useState(1);
  const [ops, setOps] = useState([]);

  const [code, setCode] = useState(
    'OPENQASM 2.0;\ninclude "qelib1.inc";\n\nqreg q[3];\ncreg q[3];\n'
  );
  const [result, setResult] = useState(null);

  const runSimulation = () => {
    fetch("/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    }).then((response) => {
      response.text().then((text) => {
        setResult(text);
      });
    });
  };

  useEffect(() => {
    let newCode = 'OPENQASM 2.0;\ninclude "qelib1.inc";\n\n';
    newCode += `qreg q[${numQubits}];\ncreg q[${numQubits}];\n\n`;
    ops.forEach((op) => {
      if (op.operator === "CX") {
        newCode += `cx q[${op.operands[0]}] q[${op.operands[1]}];\n`;
      } else {
        newCode += `${op.operator.toLowerCase()} q[${op.operands[0]}];\n`;
      }
    });
    setCode(newCode);
  }, [numQubits, ops]);

  return (
    <>
      {dragged !== null && (
        <div
          className="absolute gate"
          style={{
            top: dragged.y - 24,
            left: dragged.x - 24,
          }}
        >
          {dragged.op.operator[0]}
        </div>
      )}
      <div className="flex flex-row flex-grow">
        <Sidebar runSimulation={runSimulation} />
        <div className="flex flex-col space-y-0 flex-grow">
          <Menu />
          <Title />
          <div className="flex flex-row flex-grow">
            <div className="flex flex-col border-r-2 flex-grow">
              <GatePannel handleDrag={handleDrag} />
              <Circuit
                dragged={dragged}
                handleDrag={handleDrag}
                ops={ops}
                setOps={setOps}
                numQubits={numQubits}
                setNumQubits={setNumQubits}
              />
              <div className="w-1/2 align-middle flex items-center justify-center">
                <img src={`data:image/png;base64, ${result}`} alt="" />
              </div>
            </div>
            <div className="w-2/6 ml-4">
              <textarea className="w-full h-full" value={code} readOnly />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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
            handleDrag(
              { operator, operands: [...Array(getArity(operator)).keys()] },
              event.pageX,
              event.pageY
            );
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
