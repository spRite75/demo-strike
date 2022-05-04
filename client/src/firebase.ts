import { FirebaseOptions, getApp, initializeApp } from "firebase/app";
import {
  browserSessionPersistence,
  connectAuthEmulator,
  EmailAuthProvider,
  initializeAuth,
} from "firebase/auth";
import * as firebaseui from "firebaseui";

import { createContext } from "react";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBkg3VmuoUYLlrUnvcm-lwFHSMfsn0T-Ns",
  authDomain: "csgo-demo-analyser.firebaseapp.com",
  projectId: "csgo-demo-analyser",
  storageBucket: "csgo-demo-analyser.appspot.com",
  messagingSenderId: "623562071555",
  appId: "1:623562071555:web:ad4e0c4b5d50203a947836",
};

const firebaseUiConfig: firebaseui.auth.Config = {
  signInOptions: [
    {
      provider: EmailAuthProvider.PROVIDER_ID,
      requireDisplayName: false,
      whitelistedCountries: ["Australia"],
    },
  ],
  signInSuccessUrl: "/",
};

export class Firebase {
  private readonly app = initializeApp(firebaseConfig);
  private readonly auth = initializeAuth(this.app, {
    persistence: browserSessionPersistence,
  });
  private readonly ui: firebaseui.auth.AuthUI;

  constructor() {
    connectAuthEmulator(this.auth, "http://localhost:9099");
    this.ui = new firebaseui.auth.AuthUI(this.auth);
  }

  getAuth() {
    return this.auth;
  }

  signIn() {
    this.ui.start("#firebaseui-auth-container", firebaseUiConfig);
  }

  signOut() {
    return this.auth.signOut()
  }
}

export const firebase = new Firebase();
export const FirebaseContext = createContext(firebase);
