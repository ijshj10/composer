/* eslint-disable react/prop-types */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable no-use-before-define */
/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect, useRef, Fragment, useMemo } from "react";
import PropTypes from "prop-types";
import CodeFlask from "codeflask";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import Plot from "react-plotly.js";

import { GATES } from "../constants";
import { getArity } from "./gates";
import Sidebar from "./sidebar";
import Circuit from "./circuit";
import generateCode from "../lib/language";
import Qasm from "../lib/qasm";

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
  const [isLoading, setIsLoafing] = useState(false);

  const runSimulation = () => {
    const newResult = Qasm(code);
    setIsLoafing(true);
    console.log(newResult);
    /*
     */
    setResult(newResult);
    /*
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
    }); */
  };

  const [language, setLanguage] = useState("OPENQASM 2.0");

  useEffect(() => {
    setCode(generateCode(numQubits, ops, language));
  }, [numQubits, ops, language]);

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
          <Toolbar />
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
                {isLoading ? (
                  <div className="text-5xl">
                    Running...
                    <button type="button" onClick={() => setIsLoafing(false)}>
                      <i className="material-icons-outlined">replay</i>
                    </button>
                  </div>
                ) : (
                  result && <MyChart result={result} />
                )}
              </div>
            </div>
            <div className="w-2/6 ml-4">
              <Editor
                code={code}
                setCode={setCode}
                language={language}
                setLanguage={setLanguage}
              />
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

function Toolbar() {
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

let codeFlask;

function Editor({ code, language, setLanguage }) {
  const ref = useRef();
  useEffect(() => {
    codeFlask = new CodeFlask(ref.current, { language: "js", readonly: true });
    //    codeFlask.onUpdate((value) => setCode(value));
  }, []);

  useEffect(() => codeFlask.updateCode(code), [code]);
  const languages = ["OPENQASM 2.0", "Qiskit", "Quil"];

  return (
    <div>
      <div>
        <Menu as="div" className="relative inline-block text-left z-50">
          {({ open }) => (
            <>
              <div>
                <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
                  {language}
                  <ChevronDownIcon
                    className="-mr-1 ml-2 h-5 w-5"
                    aria-hidden="true"
                  />
                </Menu.Button>
              </div>

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items
                  static
                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  <div className="py-1">
                    {languages.map((lang) => (
                      <Menu.Item key={lang}>
                        {({ active }) => (
                          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                          <a
                            onClick={(e) => {
                              setLanguage(lang);
                              console.log(lang);
                              e.preventDefault();
                            }}
                            className={classNames(
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-700",
                              "block px-4 py-2 text-sm"
                            )}
                          >
                            {lang}
                          </a>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </>
          )}
        </Menu>
      </div>
      <div ref={ref} className="z-0" />
    </div>
  );
}

Editor.propTypes = {
  code: PropTypes.string.isRequired,
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function MyChart({ result }) {
  let xs = [];
  let ys = [];
  Object.entries(result).forEach((entry) => {
    xs = xs.concat(parseInt(entry[0], 2));
    ys = ys.concat(entry[1]);
  });

  const data = { type: "bar", x: xs, y: ys };

  console.log(data);

  return (
    <div className="w-full h-full">
      <Plot data={[data]} />
    </div>
  );
}
