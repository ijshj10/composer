import React, { useState } from "react";
import { GATES } from "../constants";
import { Sidebar } from "./sidebar";

export default function Composer() {
  const [clicked] = useState(null);
  /* const [gates, setGates] = useState([[], [], []]);
  const [code, setCode] = useState([
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
    <div className="flex flex-row">
      <Sidebar />
      <div className="flex flex-col space-y-0 flex-grow">
        <Menu />
        <Title />
        <div className="flex flex-row flex-grow">
          <div className="flex flex-col border-r-2 flex-grow">
            <GatePannel />
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
          </div>
          <div className="w-2/6 ml-4">
            <textarea className="w-full h-full" readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}

function GatePannel() {
  return (
    <div className="flex flex-row bo">
      {GATES.map((kind) => (
        <div key={kind} className="gate">
          {kind}
        </div>
      ))}
    </div>
  );
}

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
