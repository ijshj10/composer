import React from "react";
import { useContext } from "react";
import UserContext from "../context/user";

const SELECTED_COLOR = "bg-gray-200 ";

export class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: -1,
    };
  }

  handleClick = (clicked) => {
    if (this.state.clicked === clicked) {
      clicked = -1;
    }
    this.setState({ clicked });
    this.props.handleClick(clicked);
  };
  render() {
    const items = ["menu", "file_download", "file_upload", "play_arrow"];
    return (
      <div className={"flex flex-col border-r-2 w-12"}>
        {items.map((item, i) => {
          return (
            <button
              className={
                "pt-4 pb-4 focus:outline-none material-icons-outlined " +
                "hover:" +
                SELECTED_COLOR +
                " " +
                (this.state.clicked === i ? SELECTED_COLOR : "")
              }
              onClick={() => this.handleClick(i)}
            >
              {item}
            </button>
          );
        })}
      </div>
    );
  }
}

export function SidebarOpened(props) {
  const { user: loggedInUser } = useContext(UserContext);
  const title = ["Menu", "Download circuit", "Upload circuit", "Run circuit"];
  const heading = (
    <div className="flex flex-col space-y-4">
      <div className="pl-4 pt-4 font-extrabold text-xl">
        {` ${title[props.kind]}`}
      </div>
      {title[props.kind] === "Run circuit" && (
        <div>
          <div
            className="h-16 rounded-md bg-gray-700 text-white flex items-center justify-center text-2xl font-extrabold mb-4 cursor-not-allowed select-none opacity-50"
            title="Not implemented"
          >
            Run on hardware
          </div>
          <div
            className={
              "h-16 rounded-md bg-gray-700 text-white flex items-center justify-center text-2xl font-extrabold select-none " +
              (loggedInUser
                ? "cursor-pointer"
                : "opacity-50 cursor-not-allowed")
            }
            title={loggedInUser ? "" : "Need to login"}
            onClick={() => {
              if (loggedInUser) props.runSimulation();
            }}
          >
            Run simulation
          </div>
        </div>
      )}
    </div>
  );

  return <div className={"w-96 " + SELECTED_COLOR}>{heading}</div>;
}
