import { UploadBtn } from "./buttons";

export function DatasetPreview(props: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  file: File | null;
  preview: Object[];
  uploadFile: (file: File) => void;
  clearFile: () => void;
}) {
  const { fileRef, file, preview, uploadFile, clearFile } = props;

  const flag = preview.length === 0;
  const color = flag ? "text-red-500" : "text-gray-500";
  const text = flag ? "No file was uploaded" : "Displying first five rows only";

  return (
    <div>
      <div className="flex justify-center content-center mb-24">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">
          CSV File Preview
        </h2>
        <div className="grow" />
        <UploadBtn
          file={file}
          fileRef={fileRef}
          uploadFile={uploadFile}
          clearFile={clearFile}
        />
      </div>
      <div
        id="previewContainer"
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  ></path>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-emerald-700">
                  Data Preview
                </h2>
                <p className="text-sm text-emerald-600">
                  First 5 rows of your dataset
                </p>
              </div>
            </div>
            <div id="tableStats" className="text-right">
              <p className="text-xs text-emerald-600 font-bold" id="colCount">
                {flag
                  ? "0 columns"
                  : `${Object.keys(preview[0]).length} columns`}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table id="previewTable" className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {preview.length > 0 &&
                  Object.keys(preview[0]).map((key) => (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key}
                      </th>
                    </>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preview.length > 0 &&
                preview.map((row) => (
                  <tr>
                    {Object.values(row).map((v) => (
                      <td
                        onMouseOver={(e) => (e.currentTarget.innerText = v)}
                        onMouseLeave={(e) =>
                          (e.currentTarget.innerText =
                            v.length >= 100 ? v.substring(0, 100) + "..." : v)
                        }
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {v.length >= 100 ? v.substring(0, 100) + "..." : v}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 ${color}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span className={color}>{text}</span>
            </div>
            <div id="dataTypes" className="flex items-center gap-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
