import CodeMirror from "@uiw/react-codemirror";
import "codemirror/mode/clike/clike";
import "codemirror/theme/idea.css";
import PropTypes from "prop-types";
import React, { useEffect } from "react";

export default function Editor(props) {
  const { code, setCode } = props;
  let timeout;

  return (
    <CodeMirror
      value={code}
      options={{
        mode: "clike",
        theme: "idea",
      }}
      onChange={(editor) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setCode(editor.getValue());
        }, 1000);
      }}
    />
  );
}

Editor.propTypes = {
  code: PropTypes.string.isRequired,
  setCode: PropTypes.func.isRequired,
};
