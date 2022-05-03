import { FirebaseApp, initializeApp, getApp } from "firebase/app";
import {
  getAuth,
  EmailAuthProvider,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
  Auth,
} from "firebase/auth";
import * as firebaseui from "firebaseui";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

console.log("SETUP RUN");

const firebaseConfig = {
  apiKey: "AIzaSyBkg3VmuoUYLlrUnvcm-lwFHSMfsn0T-Ns",
  authDomain: "csgo-demo-analyser.firebaseapp.com",
  projectId: "csgo-demo-analyser",
  storageBucket: "csgo-demo-analyser.appspot.com",
  messagingSenderId: "623562071555",
  appId: "1:623562071555:web:ad4e0c4b5d50203a947836",
};

// Initialise Firebase
initializeApp(firebaseConfig);

// Initialise Auth
// TODO: disable this when not on localhost
connectAuthEmulator(getAuth(), "http://localhost:9099");

// Initialise Firebase UI
const firebaseUi = new firebaseui.auth.AuthUI(getAuth());

const firebaseUiConfig: firebaseui.auth.Config = {
  signInOptions: [
    {
      provider: EmailAuthProvider.PROVIDER_ID,
      requireDisplayName: false,
      whitelistedCountries: ["Australia"],
    },
  ],
  signInSuccessUrl: "/"
};

class Firebase {
  initiateSignIn() {
    setPersistence(getAuth(), browserLocalPersistence).then(() =>
      firebaseUi.start("#firebaseui-auth-container", firebaseUiConfig)
    );
  }
}

const firebase = new Firebase();

export { firebase };
