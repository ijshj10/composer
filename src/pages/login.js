import React, { useContext, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import Header from "../components/header";
import ROUTES from "../constants";
import FirebaseContext from "../context/firebase";

export default function Login() {
  const history = useHistory();
  const { firebase } = useContext(FirebaseContext);

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const isInvalid = password === "" || emailAddress === "";

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      await firebase.auth().signInWithEmailAndPassword(emailAddress, password);
      history.push(ROUTES.MAIN);
    } catch (e) {
      setEmailAddress("");
      setPassword("");
      setError(error.message);
    }
  };

  return (
    <>
      <Header />
      <div className="flex flex-col mt-64 justify-center itmes-center">
        <div className="flex flex-col self-center">
          {error && <p className="mb-4 text-xs text-red-500">{error}</p>}
          <form onSubmit={handleLogin} method="POST">
            <input
              type="text"
              placeholder="Email address"
              className="text-sm w-full mr-3 py-5 px-4 h-2 border rounded mb-2"
              onChange={({ target }) => setEmailAddress(target.value)}
              value={emailAddress}
            />
            <input
              type="password"
              placeholder="Password"
              className="text-sm w-full mr-3 py-5 px-4 h-2 border rounded mb-2"
              onChange={({ target }) => setPassword(target.value)}
              value={password}
            />
            <button
              disabled={isInvalid}
              type="submit"
              className={`bg-blue-500 text-white rounded h-8 font-bold w-full ${
                isInvalid && "opacity-50"
              }`}
            >
              Log In
            </button>
          </form>
          <div className="flex justify-center items-center flex-col w-full bg-white p-4 rounded border border-gray-400 mt-4">
            <p className="text-sm">
              Don&apos;t have an account?{" "}
              <Link to={ROUTES.SIGNUP} className="font-bold text-blue-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
