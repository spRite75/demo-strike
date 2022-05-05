import { useCallback, useState } from "react";
import { Button, Divider, Modal } from "react-daisyui";
import { DropzoneOptions, useDropzone } from "react-dropzone";
import { useUploadFile } from "react-firebase-hooks/storage";
import filesize from "filesize";
import { useFirebase } from "../hooks/useFirebase";

export function UploadModal(props: { show: boolean; close: () => void }) {
  const { show, close } = props;
  const firebase = useFirebase();
  const [upload] = useUploadFile();
  const [files, setFiles] = useState<File[]>([]);

  const cancel = () => {
    setFiles([]);
    close();
  };
  const accept = async () => {
    await upload(
      firebase.getStorageRef(files[0].name),
      await files[0].arrayBuffer()
    );
    close();
  };

  const onDrop = useCallback<NonNullable<DropzoneOptions["onDrop"]>>(
    (acceptedFiles) => {
      setFiles((files) => files.concat(acceptedFiles));
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Modal open={show} onClickBackdrop={cancel}>
      <Modal.Header>Upload Demos</Modal.Header>

      <Modal.Body>
        Upload demos for processing...
        {!!files.length && (
          <>
            <Divider />
            <aside>
              <div className="font-bold">Files:</div>
              {files.map((file, i) => (
                <div key={`${file.size}-${file.name}`}>
                  <div>{file.name}</div>
                  <div className="text-sm text-right opacity-50">
                    {filesize(file.size)}
                  </div>
                </div>
              ))}
            </aside>
          </>
        )}
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <div className="mt-5 p-10 rounded-2xl border-dashed border-2 border-sky-500">
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop some files here, or click to select files</p>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={accept} color="primary">
          Accept
        </Button>
        <Button onClick={cancel}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  );
}
