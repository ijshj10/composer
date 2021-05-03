import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Suspense, lazy } from "react";
import NotFound from "./pages/not-found";
import ROUTES from "./constants";
import useAuthListener from "./hooks/use-auth-listener";
import UserContext from "./context/user";

const Main = lazy(() => import("./pages/main"));
const Login = lazy(() => import("./pages/login"));
const Signup = lazy(() => import("./pages/signup"));

function App() {
  const { user } = useAuthListener();
  return (
    <UserContext.Provider value={{ user }}>
      <Router>
        <Suspense fallback={<p>Loading...</p>}>
          <Switch>
            <Route path={["/", "/main"]} component={Main} exact />
            <Route path={ROUTES.LOGIN} component={Login} exact />
            <Route path={ROUTES.SIGNUP} component={Signup} exact />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
