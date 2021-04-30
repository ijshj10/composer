import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import FirebaseContext from './context/firebase';

ReactDOM.render(
  <React.StrictMode>
    <FirebaseContext.Provider value={0}>
      <App />
    </FirebaseContext.Provider>
  </React.StrictMode>,
  document.getElementById('root')
);