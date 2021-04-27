import React from 'react';

const SELECTED_COLOR = " bg-gray-200";

export class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: -1,
    };
  }

  handleClick = (clicked) => {
    if(this.state.clicked == clicked) {
      clicked = -1;
    }
    this.setState({clicked});
    this.props.handleClick(clicked);
  }
  render() {
    const items = ["menu", "file_download", "file_upload", "play_arrow"]
      return (
      <div className={"flex flex-col border-r-2 h-screen w-12"}>
        {items.map((item, i) => {
          return (<button className={"pt-4 pb-4 focus:outline-none material-icons-outlined" +
           (this.state.clicked == i ? SELECTED_COLOR : "")}
          onClick={() => this.handleClick(i)}>{item}</button>);
        })}
      </div>
      );
  }
}

export function SidebarOpened(props) {
  const title = ["Menu", "Download circuit", "Upload circuit", "Run circuit"]
  const heading = (<div className="pl-4 pt-4 font-extrabold text-xl"> {title[props.kind]}</div>);



  return (<div className={"w-96" + SELECTED_COLOR}>{heading}</div>);
}

function requireLogin(props) {
  
}

 