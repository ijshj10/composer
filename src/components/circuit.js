import React from "react";

const GATES = ["H", "X", "Y", "Z", 'M'];

function GatePannel(props) {
  return (
    <div className="flex flex-row bo">
      {GATES.map((kind, i) => {
        return (
        <div key={i} className="gate"
          onMouseDown={(event) => props.handleDrag(event, kind)}>
            {kind}
        </div>); 
      })}
    </div>);
}


class Composer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: null
    };
  }
  handleDrag = (event, kind) => {
    const clicked = {x: event.clientX, y: event.clientY, kind: kind};
    const mouseMove = (event) => {
      
      this.setState({clicked: {x: event.clientX, y: event.clientY, kind}});
    };
    const drop = (event) => {
      this.setState({clicked: null});
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", drop);
    };
    this.setState({clicked});
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", drop);
  }
  render() {
    return (
    <div className="flex flex-row">
      <Sidebar />
      <div className="flex flex-col space-y-0 flex-grow">
        <Menu />
        <Title />
        <div className="flex flex-row flex-grow"> 
          <div className="flex flex-col border-r-2 flex-grow">
          <GatePannel handleDrag={this.handleDrag}/>
          {this.state.clicked !=null && 
          <div className="absolute gate"
            style={{top: this.state.clicked.y - 24, left:this.state.clicked.x - 24}}>
            {this.state.clicked.kind}
          </div>
          }
          <Circuit handleDrag={this.handleDrag} />
          </div>
          <div className="w-2/6 ml-4" ><input className="w-full h-full" type="text" defaultValue="code"></input></div>
          </div>
      </div>
    </div>);
  }
}

class Circuit extends React.Component {
  constructor(props) {
    super(props);
    this.handleDrag = (event, kind, i, j) => {
      let qubit = this.state.gates[i].slice(0,j).concat(this.state.gates[i].slice(j+1));
      let gates = this.state.gates.slice(0,i).concat(qubit, this.state.gates.slice(i+1));
      console.log(gates);
      this.setState({gates});
      props.handleDrag(event, kind);
    }
    this.state = {
      gates: [['H', 'X'], ['Y'], []],
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    }
  }

  componentDidMount() {
    const rect = this.container.getBoundingClientRect();
    
    this.setState({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
    });
  }

  render() {
    const width = this.state.width;
    const startX = Math.floor(width/20);
    const endX = startX * 19;
    const SIZE = 32;
    const gates = [];

    this.state.gates.forEach((qubit, i) => {
      qubit.forEach((gate, j) => {
        gates.push(<g key={(i,j)}>
          <rect onMouseDown={(event) => this.handleDrag(event, gate, i, j)} x={30 + 45*j} y={40+50*i-16} width={SIZE} height={SIZE} fill="white"stroke="black" strokeWidth="2"/>
          <text onMouseDown={(event) => this.handleDrag(event, gate, i, j)} className="select-none" x={30+ 45*j +12} y={40+50*i+4} fontSize="12px" fontWeight="800">{gate}</text>
        </g>);
      });
    });

    return(
    <svg className="w-full h-1/2 border-b-2 border-t-2" ref={el => (this.container = el)}>
      {this.state.gates.map((_, i) => {
        console.log(i);
        return (<line key={i} x1={20} x2={endX} y1={40+50*i} y2={40+50*i} strokeWidth={0.5} stroke="black"/>);
      })}
      {gates}
      </svg>);
  }
}

function Sidebar() {
  return (
  <div className="flex flex-col space-y-4 w-12 border-r-2 h-screen">
  <button><span className="material-icons-outlined mt-4">folder</span></button>
  <button><span className="material-icons-outlined">file_download</span></button>
  <button><span className="material-icons-outlined">file_upload</span></button>
  <button><span className="material-icons-outlined">play_arrow</span></button>
  </div>);
}

function Menu() {
  return (<div className="border-b-2 flex flex-row">
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
  return (<form className="border-b-2">
    <input type="text" defaultValue="Untitled circuit" className="p-2"></input>
  </form>)
}

export default Composer;