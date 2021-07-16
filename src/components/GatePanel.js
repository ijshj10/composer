import React from "react";
import PropTypes from "prop-types";
import { GATES } from "../constants";
import { getArity } from "./gates";

export default function GatePanel(props) {
  const { onMouseDown } = props;
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

GatePanel.propTypes = {
  onMouseDown: PropTypes.func.isRequired,
};
