import { useRef } from "react";
import { Button, Modal } from "react-daisyui";
import { useForm, SubmitHandler } from "react-hook-form";
import { useCreateProfileMutation } from "../generated/graphql";
import { useFirebase } from "../hooks/useFirebase";

type Inputs = { displayName: string; steam64Id: string };

export function CreateProfileModal(props: {
  show: boolean;
  close: () => void;
}) {
  const { show, close } = props;
  const firebase = useFirebase();
  const [createProfile] = useCreateProfileMutation({
    onCompleted: () => firebase.getAuth().currentUser?.getIdToken(true),
  });

  const { register, handleSubmit } = useForm<Inputs>();

  const cancel = () => close();
  const onSubmit: SubmitHandler<Inputs> = async ({
    displayName,
    steam64Id,
  }) => {
    await createProfile({
      variables: { input: { displayName, steam64Id } },
    });
    close();
  };

  return (
    <Modal open={show} onClickBackdrop={cancel}>
      <Modal.Header>Create Profile</Modal.Header>

      <Modal.Body>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label htmlFor="create-profile-display-name-input" className="label">
            <span className="label-text">Display Name</span>
          </label>
          <input
            id="create-profile-display-name-input"
            type="text"
            placeholder="Enter a display name"
            className="input input-bordered w-full max-w-xz"
            {...register("displayName")}
          />

          <label htmlFor="create-profile-steam-64-id-input" className="label">
            <span className="label-text">Steam ID (steam64)</span>
          </label>
          <input
            id="create-profile-steam-64-id-input"
            type="text"
            placeholder="Your Steam ID"
            className="input input-bordered w-full max-w-xz"
            {...register("steam64Id")}
          />
        </form>
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={handleSubmit(onSubmit)} color="primary">
          Save
        </Button>
        <Button onClick={cancel}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  );
}
