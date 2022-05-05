/** Returns the locally defined Firebase class wrapper */

import { useContext } from "react";
import { FirebaseContext } from "../firebase";

export function useFirebase() {
    const firebase = useContext(FirebaseContext);
    return firebase
}
