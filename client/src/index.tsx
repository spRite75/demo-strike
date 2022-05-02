import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyBkg3VmuoUYLlrUnvcm-lwFHSMfsn0T-Ns",
  authDomain: "csgo-demo-analyser.firebaseapp.com",
  projectId: "csgo-demo-analyser",
  storageBucket: "csgo-demo-analyser.appspot.com",
  messagingSenderId: "623562071555",
  appId: "1:623562071555:web:ad4e0c4b5d50203a947836"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
