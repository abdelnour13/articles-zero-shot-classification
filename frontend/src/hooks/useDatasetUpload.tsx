import { useRef, useState } from "react";
import Papa from "papaparse";

export type UseDatasetUploadReturn = [
  React.RefObject<HTMLInputElement | null>,
  File | null,
  Object[],
  (file : File) => void,
  () => void
];

export function useDatasetUpload() : UseDatasetUploadReturn {

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Object[]>([]);

  const uploadFile = (file: File) => {

    setFile(file);

    Papa.parse<Object, File>(file, {
      header: true,
      complete: function (results) {
        results.data.forEach((row, _i) => {
          setPreview((prev) => [...prev, row]);
        });
      },
      error: function (error) {
        console.error("Error parsing CSV:", error);
      },
      skipFirstNLines: 0,
      preview: 5,
    });
  };

  const clearFile = () => {

    setFile(null);
    setPreview([]);

    if (fileRef.current !== null) {
      fileRef.current.value = "";
    }
    
  };

  return [fileRef, file, preview, uploadFile, clearFile]

}