import React from "react";
import { GATES, SIZE } from "../constants";
import { Sidebar, SidebarOpened } from "./sidebar";

class Composer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: null,
      gates: [[], [], []],
      dropI: null,
      dropJ: null,
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      code: [
        'OPENQASM 2.0;\ninclude "qelib1.inc";\n\nqreg q[3];\ncreg q[3];\n',
      ],
      result: null,
      sidebarSelected: -1,
    };
  }

  // Drag and drop highlight
  getIndex = (clientX, clientY) => {
    const x = clientX - this.state.left;
    const y = clientY - this.state.top;
    let i;
    const rows = this.state.gates.length;
    if (y < 0) {
      return [undefined, undefined];
    } else if (y < 65) {
      i = 0;
    } else {
      i = Math.min(Math.ceil((y - 65) / 50), rows - 1);
    }

    const cols = this.state.gates[i].length;

    let j;
    if (x < 0) {
      return [undefined, undefined];
    } else if (x < 46) {
      j = 0;
    } else {
      j = Math.max(Math.min(Math.ceil((x - 46) / 45), cols), 0);
    }
    return [i, j];
  };

  // Drag
  handleDrag = (event, kind, i, j) => {
    if (i !== undefined) {
      let qubit = this.state.gates[i]
        .slice(0, j)
        .concat(this.state.gates[i].slice(j + 1));
      let gates = this.state.gates.slice(0, i);
      gates.push(qubit);
      gates = gates.concat(this.state.gates.slice(i + 1));
      this.setState({ gates });
    }

    const clicked = { x: event.clientX, y: event.clientY, kind: kind };
    const mouseMove = (event) => {
      this.setState({ clicked: { x: event.clientX, y: event.clientY, kind } });
    };
    const drop = (event) => {
      this.setState({ clicked: null });
      const [i, j] = this.getIndex(event.clientX, event.clientY);
      const gates = this.state.gates.slice();

      if (i !== undefined) {
        // do update gates
        const newGates = gates[i].slice(0, j);
        newGates.push(kind);
        gates[i] = newGates.concat(gates[i].slice(j));
      }
      this.setState({ gates, code: this.generateCode(gates) });
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", drop);
    };
    this.setState({ clicked, dropI: i, dropJ: j });
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", drop);
  };

  // svg size
  setDimension = (rect) => {
    this.setState({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  };

  // openqasm generation

  generateCode = (gates) => {
    const qubitCount = gates.length;
    const qasm = [
      `OPENQASM 2.0;\ninclude "qelib1.inc";\n\nqreg q[${qubitCount}];\ncreg q[${qubitCount}];\n`,
    ];

    let maxLen = 0;
    gates.forEach((qubit) => {
      maxLen = Math.max(qubit.length, maxLen);
    });

    for (let j = 0; j < maxLen; j++) {
      gates.forEach((qubit, i) => {
        if (qubit[j] !== undefined) {
          let instr;
          if (qubit[j] === "M") {
            instr = `measure q[${i}] -> c[${i}];`;
          } else {
            instr = `${qubit[j].toLowerCase()} q[${i}];`;
          }
          qasm.push(instr);
        }
      });
    }

    return qasm.join("\n");
  };

  addQubit = () => {
    this.setState({ gates: this.state.gates.concat([[]]) });
  };

  runSimulation = () => {
    fetch("/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: this.state.gates,
      }),
    }).then((response) => {
      response.text().then((text) => {
        this.setState({ result: text });
      });
    });
  };

  handleSidebarClick = (clicked) => {
    this.setState({ sidebarSelected: clicked });
  };

  render() {
    return (
      <div className="flex flex-row">
        <Sidebar handleClick={this.handleSidebarClick} />
        {this.state.sidebarSelected !== -1 && (
          <SidebarOpened kind={this.state.sidebarSelected} />
        )}
        <div className="flex flex-col space-y-0 flex-grow">
          <Menu />
          <Title />
          <div className="flex flex-row flex-grow">
            <div className="flex flex-col border-r-2 flex-grow">
              <GatePannel handleDrag={this.handleDrag} />
              {this.state.clicked !== null && (
                <div
                  className="absolute gate"
                  style={{
                    top: this.state.clicked.y - 24,
                    left: this.state.clicked.x - 24,
                  }}
                >
                  {this.state.clicked.kind}
                </div>
              )}
              <Circuit
                handleDrag={this.handleDrag}
                dragged={this.state.clicked}
                gates={this.state.gates}
                notifyDimension={this.setDimension}
                width={this.state.width}
                getIndex={this.getIndex}
                addQubit={this.addQubit}
              />
              {this.state.result && <Histogram result={this.state.result} />}
            </div>
            <div className="w-2/6 ml-4">
              <textarea
                className="w-full h-full"
                value={this.state.code}
                readOnly
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class Circuit extends React.Component {
  constructor(props) {
    super(props);
    this.handleDrag = props.handleDrag;
  }

  componentDidMount() {
    const rect = this.container.getBoundingClientRect();
    this.props.notifyDimension(rect);
  }

  render() {
    const width = this.props.width;
    const startX = Math.floor(width / 20);
    const endX = startX * 19;
    const gates = [];

    let key = 0;

    let dropI, dropJ;

    if (this.props.dragged !== null) {
      [dropI, dropJ] = this.props.getIndex(
        this.props.dragged.x,
        this.props.dragged.y
      );
    }

    let i = 0;
    this.props.gates.forEach((qubit, ii) => {
      let j = 0;
      qubit.forEach((gate, jj) => {
        if (i === dropI && j === dropJ) {
          gates.push(
            <g key={key++}>
              <rect
                x={30 + 45 * j}
                y={40 + 50 * i - 16}
                width={SIZE}
                height={SIZE}
                fill="white"
                stroke="black"
                strokeDasharray="4 1"
                strokeWidth="1"
              />
            </g>
          );
          j++;
        }
        gates.push(
          <g key={key++}>
            <rect
              onMouseDown={(event) => this.handleDrag(event, gate, ii, jj)}
              x={30 + 45 * j}
              y={40 + 50 * i - 16}
              width={SIZE}
              height={SIZE}
              fill="white"
              stroke="black"
              strokeWidth="2"
            />
            <text
              onMouseDown={(event) => this.handleDrag(event, gate, ii, jj)}
              className="select-none"
              x={30 + 45 * j + 12}
              y={40 + 50 * i + 4}
              fontSize="12px"
              fontWeight="800"
            >
              {gate}
            </text>
          </g>
        );
        j++;
      });
      if (i === dropI && j === dropJ) {
        gates.push(
          <g key={key++}>
            <rect
              x={30 + 45 * j}
              y={40 + 50 * i - 16}
              width={SIZE}
              height={SIZE}
              fill="white"
              stroke="black"
              strokeDasharray="4 1"
              strokeWidth="1"
            />
          </g>
        );
        j++;
      }
      i++;
    });

    return (
      <svg
        className="w-full h-1/2 border-b-2 border-t-2"
        ref={(el) => (this.container = el)}
      >
        {this.props.gates.map((qubit, i) => {
          return (
            <line
              key={i}
              x1={20}
              x2={endX}
              y1={40 + 50 * i}
              y2={40 + 50 * i}
              strokeWidth={0.5}
              stroke="black"
            />
          );
        })}
        {gates}
        <text
          className="material-icons-outlined select-none"
          x={5}
          y={40 + 50 * this.props.gates.length - 10}
          onClick={this.props.addQubit}
        >
          add_circle_outlined
        </text>
      </svg>
    );
  }
}

function GatePannel(props) {
  return (
    <div className="flex flex-row bo">
      {GATES.map((kind, i) => {
        return (
          <div
            key={i}
            className="gate"
            onMouseDown={(event) => props.handleDrag(event, kind)}
          >
            {kind}
          </div>
        );
      })}
    </div>
  );
}

function Menu() {
  return (
    <div className="border-b-2 flex flex-row">
      <button className="menu">File</button>
      <button className="menu">Edit</button>
      <button className="menu">Inspect</button>
      <button className="menu">View</button>
      <button className="menu">Share</button>
      <div></div>
    </div>
  );
}

function Title() {
  return (
    <form className="border-b-2">
      <input
        type="text"
        defaultValue="Untitled circuit"
        className="p-2"
      ></input>
    </form>
  );
}

function Histogram(props) {
  return (
    <div className="w-1/2 align-middle flex items-center justify-center">
      <img src={"data:image/png;base64," + props.result} alt="" />
    </div>
  );
}

export default Composer;
