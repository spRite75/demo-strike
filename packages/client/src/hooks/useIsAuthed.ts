import { useContext } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { FirebaseContext } from "../firebase";

/** Returns whether the user is authenticated or not */
export function useIsAuthed() {
  const firebase = useContext(FirebaseContext);
  const [user] = useAuthState(firebase.getAuth());
  return !!user
}
