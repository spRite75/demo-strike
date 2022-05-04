import React from "react";
import { Button, Navbar } from "react-daisyui";
import { useFirebase } from "../hooks/useFirebase";
import { useIsAuthed } from "../hooks/useIsAuthed";
import { useProfile } from "../hooks/useProfile";

export function Header() {
  const isAuthed = useIsAuthed();
  const { loading, data: profile } = useProfile();
  const firebase = useFirebase();

  return (
    <Navbar className="shadow-lg bg-neutral text-neutral-content rounded-box">
      <Navbar.Start className="px-2 mx-2">
        <span className="text-lg font-bold">Demo-Strike</span>
      </Navbar.Start>

      {profile && (
        <Navbar.Center className="px-2 mx-2">
          <div className="flex items-stretch">
            <Button color="ghost">Home</Button>
            <Button color="ghost">Matches</Button>
          </div>
        </Navbar.Center>
      )}

      {!loading && (
        <Navbar.End className="px-2 mx-2">
          {!isAuthed && (
            <Button color="primary" onClick={() => firebase.signIn()}>
              Sign In
            </Button>
          )}
          {isAuthed && (
            <Button onClick={() => firebase.signOut()}>Sign Out</Button>
          )}
        </Navbar.End>
      )}
    </Navbar>
  );
}
