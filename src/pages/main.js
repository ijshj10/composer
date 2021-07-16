import React from "react";
import Composer from "../components/composer";
import Header from "../components/header";

export default function Main() {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-shrink-0 flex-grow-0">
        <Header />
      </div>
      <div className="flex-grow">
        <Composer />
      </div>
    </div>
  );
}
