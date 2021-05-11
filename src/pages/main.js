import React from "react";
import Composer from "../components/composer";
import Header from "../components/header";

export default function Main() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <Composer />
    </div>
  );
}
