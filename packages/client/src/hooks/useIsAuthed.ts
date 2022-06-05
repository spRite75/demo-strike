import { IdTokenResult } from "firebase/auth";
import { useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { FirebaseContext } from "../firebase";

/** Returns whether the user is authenticated or not as well as any flags from the token */
export function useIsAuthed() {
  const [idTokenResult, setIdTokenResult] = useState<IdTokenResult>();
  const firebase = useContext(FirebaseContext);
  const [user] = useAuthState(firebase.getAuth());

  useEffect(() => {
    user?.getIdTokenResult().then((result) => setIdTokenResult(result));
  }, [user]);

  return {
    isAuthed: !!user,
    needsProfile: !!idTokenResult?.claims.needsProfile,
  };
}
