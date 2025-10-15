import { useEffect } from "react";
import "./App.css";
import { ClearBtn, DatasetPreview, Labels, PredictBtn } from "./components";
import { useChunkClassify, useDatasetUpload, useLabels } from "./hooks";
import { notification } from "antd";


function App() {

  const [fileRef, file, preview, uploadFile, clearFile] = useDatasetUpload();

  const [
    labels,
    name,
    description,
    addLabel,
    removeLabel,
    clear,
    setName,
    setDescription,
  ] = useLabels();

  const { makeRequest, isError, progress, status, result_uri } = useChunkClassify();

  const [api, contextHolder] = notification.useNotification();

  const clearAll = () => {
    clearFile();
    clear();
  }

  const predict = (_e : React.MouseEvent<HTMLButtonElement, MouseEvent>) => {

    if (file && labels.length > 0) {
      makeRequest(file, labels, undefined);
      return true;
    }

    if (!file) {
      api.error({
        message : "Upload a dataset first.",
        duration : 5
      })
    } else if (labels.length === 0) {
      api.error({
        message : "Enter at least one label.",
        duration : 5
      })
    }

    return false;

  }

  useEffect(() => {
    
    if (isError || status === "failed") {
      api.error({
        message : "unexpected error has occurred please contact the support."
      })
    }

  }, [isError, status])

  return (
    < >
      {contextHolder}
      <div className="m-8 *:mb-8">
        <div>
          <DatasetPreview
            fileRef={fileRef}
            file={file}
            preview={preview}
            uploadFile={uploadFile}
            clearFile={clearFile}
          />
        </div>
        <div>
          <Labels
            addLabel={addLabel}
            description={description}
            labels={labels}
            name={name}
            removeLabel={removeLabel}
            setDescription={setDescription}
            setName={setName}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <PredictBtn onClick={predict} progress={progress} status={status} results_uri={result_uri} isError={isError} />
          <ClearBtn onClick={() => clearAll()} />
        </div>
      </div>
    </>
  );
}

export default App;
