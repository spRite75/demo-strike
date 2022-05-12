import { useCallback, useState } from "react";
import { Button, Divider, Modal } from "react-daisyui";
import { DropzoneOptions, useDropzone } from "react-dropzone";
import { useUploadFile } from "react-firebase-hooks/storage";
import filesize from "filesize";
import { useFirebase } from "../hooks/useFirebase";
import { useUploadDemosMutation } from "../generated/graphql";

export function UploadModal(props: { show: boolean; close: () => void }) {
  const { show, close } = props;
  const firebase = useFirebase();
  const [uploadFile, _, status, error] = useUploadFile();
  const [uploadInfo] = useUploadDemosMutation();
  const uploadProgessText = status
    ? `${Math.floor((status.bytesTransferred / status.totalBytes) * 100)}% `
    : "";

  // files to upload
  const [files, setFiles] = useState<File[]>([]);
  // current file being uploaded
  const [currentFile, setCurrentFile] = useState<File>();
  // files uploaded
  const [completedFiles, setCompletedFiles] = useState<File[]>([]);

  const cancel = () => {
    setFiles([]);
    close();
  };
  const accept = async () => {
    for (const file of files) {
      setCurrentFile(file);
      const storageRef = firebase.getStorageRef(file.name);
      await uploadFile(storageRef, file);
      await uploadInfo({
        variables: {
          input: {
            demos: [
              {
                fileName: file.name,
                lastModified: file.lastModified.toString(),
              },
            ],
          },
        },
      });
      setCompletedFiles((completedFiles) => completedFiles.concat(file));
    }

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
                    {currentFile === file && <span>{uploadProgessText}</span>}
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
