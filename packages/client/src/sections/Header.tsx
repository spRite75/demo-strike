import { useEffect, useState } from "react";
import { Button, Navbar } from "react-daisyui";
import { useFirebase } from "../hooks/useFirebase";
import { useIsAuthed } from "../hooks/useIsAuthed";
import { useProfile } from "../hooks/useProfile";
import { UploadModal } from "./UploadModal";
import { CreateProfileModal } from "./CreateProfileModal";
import { Link } from "react-router-dom";

export function Header() {
  const { isAuthed, needsProfile } = useIsAuthed();
  const { data: profile } = useProfile();
  const firebase = useFirebase();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);

  return (
    <>
      <Navbar className="shadow-lg bg-neutral text-neutral-content rounded-box">
        <Navbar.Start className="px-2 mx-2">
          <span className="text-lg font-bold">Demo-Strike</span>
        </Navbar.Start>

        <Navbar.Center className="px-2 mx-2">
          <div className="flex items-stretch">
            <Link to="/">
              <Button color="ghost">Home</Button>
            </Link>
            {profile && (
              <Link to="/matches">
                <Button color="ghost">Matches</Button>
              </Link>
            )}
          </div>
        </Navbar.Center>

        <Navbar.End className="px-2 mx-2">
          {profile && (
            <Button color="ghost" onClick={() => setShowUploadModal(true)}>
              Upload
            </Button>
          )}
          {needsProfile && (
            <Button color="accent" onClick={() => setShowUploadModal(true)}>
              Create profile to upload demos
            </Button>
          )}
          {!isAuthed && (
            <Button color="primary" onClick={() => firebase.signIn()}>
              Sign In
            </Button>
          )}
          {isAuthed && (
            <Button onClick={() => firebase.signOut()}>Sign Out</Button>
          )}
        </Navbar.End>
      </Navbar>
      <UploadModal
        show={showUploadModal}
        close={() => setShowUploadModal(false)}
      />
      <CreateProfileModal
        show={showCreateProfileModal}
        close={() => setShowCreateProfileModal(false)}
      />
    </>
  );
}
