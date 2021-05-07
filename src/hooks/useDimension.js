import { useState, useRef, useEffect } from "react";

const useBbox = () => {
  const ref = useRef();
  const [bbox, setBbox] = useState({
    width: 500,
    height: 500,
    left: 0,
    top: 0,
  });

  const set = () =>
    setBbox(
      ref && ref.current
        ? ref.current.getBoundingClientRect()
        : { width: 500, height: 500, left: 0, top: 0 }
    );

  useEffect(() => {
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  return [bbox, ref];
};

export default useBbox;
