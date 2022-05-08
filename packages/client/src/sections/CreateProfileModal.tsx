import React, { useRef } from "react";
import { Button, Modal } from "react-daisyui";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCreateProfileMutation } from "../generated/graphql";
import { useFirebase } from "../hooks/useFirebase";

export function CreateProfileModal(props: {
  show: boolean;
  close: () => void;
}) {
  const { show, close } = props;
  const firebase = useFirebase();
  const [createProfile] = useCreateProfileMutation({
    onCompleted: () => firebase.getAuth().currentUser?.getIdToken(true),
  });
  const displayNameInput = useRef<HTMLInputElement>(null);

  const cancel = () => close();
  const save = async () => {
    const displayName = displayNameInput.current?.value;
    if (!displayName) return;

    await createProfile({
      variables: { input: { displayName } },
    });
    close();
  };

  return (
    <Modal open={show} onClickBackdrop={cancel}>
      <Modal.Header>Create Profile</Modal.Header>

      <Modal.Body>
        <label htmlFor="create-profile-display-name-input" className="label">
          <span className="label-text">Display Name</span>
        </label>
        <input
          ref={displayNameInput}
          id="create-profile-display-name-input"
          type="text"
          placeholder="Enter a dsiplay name"
          className="input input-bordered w-full max-w-xz"
        />
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={save} color="primary">
          Save
        </Button>
        <Button onClick={cancel}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  );
}
