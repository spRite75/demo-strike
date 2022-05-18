import { DateTime } from "luxon";
import { useCallback, useState } from "react";
import { DropzoneOptions, useDropzone } from "react-dropzone";
import { useUploadFile } from "react-firebase-hooks/storage";
import { useUploadDemosMutation } from "../generated/graphql";
import { useFirebase } from "./useFirebase";

export function useDropzoneUpload() {
  const firebase = useFirebase();
  const [uploadFile, _, status, error] = useUploadFile();
  const [uploadInfo] = useUploadDemosMutation();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [inProgressFile, setInProgressFile] = useState<File>();
  const [completedFiles, setCompletedFiles] = useState<File[]>([]);

  const onDrop = useCallback<NonNullable<DropzoneOptions["onDrop"]>>(
    (acceptedFiles) => {
      setSelectedFiles((files) => [...files, ...acceptedFiles]);
    },
    []
  );

  const dropzone = useDropzone({ onDrop });

  const reset = () => {
    setSelectedFiles([]);
    setInProgressFile(undefined);
    setCompletedFiles([]);
  };

  const upload = async () => {
    const localCompletedFiles: File[] = [];
    for (const file of selectedFiles) {
      setInProgressFile(file);
      const storageRef = firebase.getStorageRef(file.name);
      await uploadFile(storageRef, file);
      setInProgressFile(undefined);
      setCompletedFiles((completedFiles) => [...completedFiles, file]);
      localCompletedFiles.push(file);
    }

    await uploadInfo({
      variables: {
        input: {
          demos: localCompletedFiles.map((file) => ({
            fileName: file.name,
            lastModified: DateTime.fromMillis(file.lastModified),
          })),
        },
      },
    });

    setCompletedFiles([]);
  };

  return {
    selectedFiles,
    inProgressFile,
    completedFiles,
    uploadStatus: status,
    reset,
    upload,
    dropzone,
  };
}
