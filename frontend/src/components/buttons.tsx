import { Progress, Modal, Button } from "antd";
import { useState } from "react";
import type { JobStatus } from "../types";

export function PredictBtn(props: {
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => boolean;
  progress : number;
  status : JobStatus;
  results_uri : string | undefined;
  isError : boolean;
}) {

  const { progress, status, results_uri, isError } = props;

  const statusMap: Record<
    JobStatus,
    "normal" | "exception" | "active" | "success"
  > = {
    pending: "normal",
    failed: "exception",
    completed: "success",
    processing: "active",
  };

  const [isModalOpen, setIsModelOpen] = useState(false);

  const onClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (props.onClick(e)) {
      setIsModelOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={onClick}
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          ></path>
        </svg>
        Predict
      </button>
      <Modal
        title="Progress"
        open={isModalOpen}
        onCancel={(_e) => setIsModelOpen(false)}
        centered={true}
        okButtonProps={{ className : "hidden" }}
        cancelButtonProps={{ className : "hidden" }}
      >
        <div className="p-6 flex justify-center content-center" >
          <div className="flex flex-col gap-6" >
            <Progress
              type="circle"
              percent={Math.floor(100 * 100 * progress) / 100.0}
              status={!isError ? statusMap[status] : "exception"}
            />
            <Button href={`/api${results_uri}`} disabled={status !== "completed"} >Download</Button>
            </div>
        </div>
      </Modal>
    </>
  );
}

export function ClearBtn(props: {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  const { onClick } = props;

  return (
    <>
      <button
        className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        onClick={onClick}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          ></path>
        </svg>
        Clear All
      </button>
    </>
  );
}

export function UploadBtn(props: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  file: File | null;
  uploadFile: (f: File) => void;
  clearFile: () => void;
}) {
  const { file, fileRef, uploadFile, clearFile } = props;

  const upload: React.ReactEventHandler<HTMLButtonElement> = (_e) => {
    if (fileRef.current !== null) {
      fileRef.current.click();
    }
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    const KB = 1024;
    const MB = 1024 * 1024;

    if (bytes <= 102.4) {
      return `${bytes.toFixed(2)} B`;
    } else if (bytes <= 102.4 * KB) {
      return `${(bytes / KB).toFixed(2)} ko`;
    } else {
      return `${(bytes / MB).toFixed(2)} mo`;
    }
  };

  const formatFileName = (name: string) => {
    const N = 15;

    if (name.length < N) {
      return name;
    }

    const filename = name.split(".").slice(0, -1).join(".");
    const extension = name.split(".").at(-1);

    return `${filename.substring(0, N) + "..."}${extension}`;
  };

  return (
    <>
      <div className="space-y-4 relative">
        <button
          onClick={upload}
          id="uploadBtn"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
        >
          <input
            type="file"
            id="dataset"
            className="hidden"
            ref={fileRef}
            onChange={onFileChange}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          ></input>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          Upload File
        </button>

        {file && (
          <div
            id="filePreview"
            className="bg-gray-50 border-2 border-emerald-200 rounded-lg p-4 absolute right-0 w-fit"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {formatFileName(file.name)}
                  </p>
                  <p className="text-sm text-gray-500 text-nowrap">
                    {formatFileSize(file.size)} • CSV file
                  </p>
                </div>
              </div>

              <button
                onClick={(_e) => clearFile()}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
