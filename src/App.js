import { BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import { Suspense, lazy } from 'react';
import NotFound from './pages/not-found';

const Main = lazy(() => import('./pages/main') );


function App() {
  return (
    <Router>
      <Suspense fallback={<p>Loading...</p>}>
        <Switch>
          <Route path={['/', '/main']} component={Main} exact/>
          <Route component={NotFound}/>
        </Switch>
      </Suspense>
    </Router>    
  );
}

export default App;
