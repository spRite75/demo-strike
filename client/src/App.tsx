import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

import { firebase } from "./firebase"
import { getAuth } from 'firebase/auth';
import { useAuthState } from "react-firebase-hooks/auth";

import { Button } from "./components/Button";


function App() {
  const [user] = useAuthState(getAuth())
  const signIn = () => firebase.initiateSignIn();

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Welcome to Demo Strike</h1>
          <p className="py-6">Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a id nisi.</p>
          { user ? <span>Welcome { user.displayName || "<unknown>" }</span> : <Button action={signIn}>Sign in</Button> }
        </div>
      </div>
    </div>
  );
}

export default App;
