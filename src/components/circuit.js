/* eslint-disable no-use-before-define */
/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { GATES } from "../constants";
import { Sidebar } from "./sidebar";
import useDimension from "../hooks/useDimension";

export default function Composer() {
  const [clicked, setClicked] = useState(null);

  const handleDrag = (kind, x, y) => {
    setClicked({ kind, x, y });
    const handleMouseMove = (event) => {
      setClicked({ kind, x: event.pageX, y: event.pageY });
    };
    const handleDrop = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleDrop);
      setClicked(null);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleDrop);
  };

  const [gates, setGates] = useState([
    { key: 0, op: [] },
    { key: 1, op: [] },
    { key: 2, op: [] },
  ]);

  /* const [code, setCode] = useState([
    'OPENQASM 2.0;\ninclude "qelib1.inc";\n\nqreg q[3];\ncreg q[3];\n',
  ]);
  const [result, setResult] = useState(null);
  const [sidebarSelected, setSidebarSelected] = useState(-1);

  handleDrag = (event, kind) => {
    const clicked = { x: event.clientX, y: event.clientY, kind };
    const mouseMove = (event) => {
      this.setState({ clicked: { x: event.clientX, y: event.clientY, kind } });
    };
    this.setState({ clicked, dropI: i, dropJ: j });
    window.addEventListener('mousemove', mouseMove);
  }; */

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
          {clicked.kind}
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
              <Circuit gates={gates} setGates={setGates} />
            </div>
            <div className="w-2/6 ml-4">
              <textarea className="w-full h-full" readOnly />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Circuit(props) {
  const startX = 30;
  const startY = 40;

  const { gates, setGates } = props;
  const [dimension, ref] = useDimension();

  return (
    <div className="w-full h-1/2 border-b-2 border-t-2" ref={ref}>
      <svg viewBox={`0 0 ${dimension.width} ${dimension.height}`}>
        {gates.map((qubit, index) => {
          const height = startY + 50 * index;
          return (
            <g key={qubit.key} transform={`translate(0,${height})`}>
              <g>
                <svg
                  className=""
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </g>
              <line
                x1={startX}
                x2={dimension ? dimension.left + dimension.width : 0}
                y1={5}
                y2={5}
                strokeWidth={0.5}
                stroke="black"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

Circuit.propTypes = {
  gates: PropTypes.array.isRequired,
  setGates: PropTypes.func.isRequired,
};

function GatePannel(props) {
  const { handleDrag } = props;
  return (
    <div className="flex flex-row bo">
      {GATES.map((kind) => (
        <button
          type="button"
          key={kind}
          className="gate"
          onMouseDown={(event) => {
            handleDrag(kind, event.pageX, event.pageY);
          }}
        >
          {kind}
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

const gateKeyGenerator = keyGenGenerator(3);
