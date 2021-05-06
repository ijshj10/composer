import React, { useState, useContext } from "react";
import PropTypes from "prop-types";
import UserContext from "../context/user";

const SELECTED_COLOR = "bg-gray-200 ";

export default function Sidebar() {
  const [clicked, setClicked] = useState(-1);

  const handleClick = (newClicked) => {
    if (clicked === newClicked) {
      setClicked(-1);
    } else {
      setClicked(newClicked);
    }
  };
  const items = ["menu", "file_download", "file_upload", "play_arrow"];
  return (
    <div className="flex flex-row border-r-2">
      <div className="flex flex-col  w-12">
        {items.map((item, i) => (
          <button
            key={item}
            type="button"
            className={`pt-4 pb-4 focus:outline-none material-icons-outlined hover:bg-gray-200 
          ${clicked === i ? SELECTED_COLOR : ""}`}
            onClick={() => handleClick(i)}
          >
            {item}
          </button>
        ))}
      </div>
      {clicked !== -1 && <SidebarOpened kind={clicked} />}
    </div>
  );
}

function SidebarOpened(props) {
  const { user: loggedInUser } = useContext(UserContext);
  const title = ["Menu", "Download circuit", "Upload circuit", "Run circuit"];
  const { kind } = props;
  const heading = (
    <div className="flex flex-col space-y-4">
      <div className="pl-4 pt-4 font-extrabold text-xl">{` ${title[kind]}`}</div>
      {title[kind] === "Run circuit" && (
        <div>
          <div
            className="h-16 rounded-md bg-gray-700 text-white flex items-center justify-center text-2xl font-extrabold mb-4 cursor-not-allowed select-none opacity-50"
            title="Not implemented"
          >
            Run on hardware
          </div>
          <button
            type="button"
            className={`h-16 rounded-md bg-gray-700 text-white flex items-center justify-center text-2xl font-extrabold select-none w-full ${
              loggedInUser ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
            }`}
            title={loggedInUser ? "" : "Need to login"}
            onClick={() => {
              if (loggedInUser) props.runSimulation();
            }}
          >
            Run simulation
          </button>
        </div>
      )}
    </div>
  );

  return <div className={`w-96 ${SELECTED_COLOR}`}>{heading}</div>;
}

SidebarOpened.propTypes = {
  kind: PropTypes.number.isRequired,
  runSimulation: PropTypes.func.isRequired,
};

export { Sidebar };
