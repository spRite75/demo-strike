import { useContext, useEffect, EffectCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { FirebaseContext } from "../firebase";

/** Executes a side effect when firebase auth user changes */
export function useAuthEffect(effect: EffectCallback) {
  const firebase = useContext(FirebaseContext);
  const [user] = useAuthState(firebase.getAuth());
  useEffect(effect, [user]);
}
