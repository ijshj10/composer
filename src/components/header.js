import { Link } from "react-router-dom";
import ROUTES from '../constants';
import { useContext } from 'react';
import UserContext from '../context/user';
import {firebase} from '../lib/firebase';
import {useHistory} from 'react-router';

export default function Header() {
  const {user: loggedInUser} = useContext(UserContext);
  const history = useHistory();
  return (
    <header className="h-16 bg-white border-b border-gray">
      <div className="flex justify-between h-full text-gray-500 ">
        <div className="text-center flex items-center cursor-pointer pl-4 text-2xl hover:text-gray-900">
          <h1>
            <Link to="/">
              Ion trap
            </Link>
          </h1>
        </div>  
        <div className="text-center flex items-center align-items space-x-8 pr-4 ">
          {loggedInUser ? (
              <div className="cursor-pointer hover:text-gray-900 ">
              <button 
                type="button"
                title="Sign out"
                onClick={() => {firebase.auth().signOut(); history.push(ROUTES.MAIN)}}>
                Sign out
              </button>
            </div>
            ):
            (
            <>
            <div className="cursor-pointer hover:text-gray-900 ">
              <Link to={ROUTES.LOGIN}>
                Login
              </Link>
            </div>
            <div className="cursor-pointer hover:text-gray-900 ">
              <Link to={ROUTES.SIGNUP}>
                Sign up
              </Link>
            </div>
            </>
          )
        }
        </div>
      </div>
    </header>
  );
}