import { Button, Divider, Modal } from "react-daisyui";
import filesize from "filesize";
import { useDropzoneUpload } from "../hooks/useDropzoneUpload";

export function UploadModal(props: { show: boolean; close: () => void }) {
  const { show, close } = props;
  const {
    selectedFiles,
    inProgressFile,
    completedFiles,
    uploadStatus,
    reset,
    upload,
    dropzone: { getRootProps, getInputProps, isDragActive },
  } = useDropzoneUpload();

  const uploadProgessText = uploadStatus
    ? `${Math.floor(
        (uploadStatus.bytesTransferred / uploadStatus.totalBytes) * 100
      )}% `
    : "";

  const cancel = () => {
    reset();
    close();
  };

  const accept = async () => {
    await upload();
    close();
  };

  return (
    <Modal open={show} onClickBackdrop={cancel}>
      <Modal.Header>Upload Demos</Modal.Header>

      <Modal.Body>
        Upload demos for processing...
        {!!selectedFiles.length && (
          <>
            <Divider />
            <aside>
              <div className="font-bold">Files:</div>
              {selectedFiles.map((file, i) => (
                <div key={`${file.size}-${file.name}`}>
                  <div>{file.name}</div>
                  <div className="text-sm text-right opacity-50">
                    {inProgressFile === file && (
                      <span>{uploadProgessText}</span>
                    )}
                    {completedFiles.some(
                      (completedFile) => completedFile === file
                    ) && <span>✔</span>}
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
