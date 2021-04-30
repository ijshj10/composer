import { Link } from "react-router-dom";
import ROUTES from '../constants';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray">
      <div className="flex justify-between h-full">
        <div className="text-gray-700 text-center flex items-center cursor-pointer pl-4">
          <h1>
            <Link to="/">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </Link>
          </h1>
        </div>  
        <div className="text-gray-700 text-center flex items-center align-items space-x-8 pr-4">
          {false ? (
            <>
            <div className="cursor-pointer">
              <Link to={ROUTES.LOGIN}>
                Login
              </Link>
            </div>
            <div className="cursor-pointer">
              <Link to={ROUTES.SIGNUP}>
                Sign up
              </Link>
            </div>
            </>) :
            (
              <div className="cursor-pointer">
              <Link to={ROUTES.LOGIN}>
                Logout
              </Link>
            </div>
            )
        }
        </div>
      </div>
    </header>
  );
}