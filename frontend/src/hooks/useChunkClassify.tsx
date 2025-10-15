import axios from "axios";
import type { JobStatus, Label } from "../types";
import { useEffect, useState } from "react";
import type { Job } from "../types";

export interface UseChunkClassifyReturn {
  makeRequest : (file: File, labels: Label[], multiLabel : boolean | undefined) => void,
  isError: boolean;
  progress: number;
  status: JobStatus;
  result_uri: string | undefined;
}

export function useChunkClassify(): UseChunkClassifyReturn {
  
  // State
  const [isError, setIsError] = useState<boolean>(false);
  const [job, setJob] = useState<Job | null>(null);

  // WebSocket
  const handleWsResponse = (job: Job) => {

    console.log("Attempting to connect to websocket")

    const socket = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/${job.id}`)

    socket.onmessage = (event) => {
      const job: Job = JSON.parse(event.data);
      setJob(job);
      setIsError(job.status == "failed");
    };

    socket.onerror = (_e) => setIsError(true);

  };

  useEffect(() => {
    console.log(job)
  }, [job])

  const makeRequest = (
    file: File, 
    labels: Label[],
    multiLabel : boolean | undefined,
  ) => {

    multiLabel = multiLabel || false

    // Data
    const data = new FormData();
    data.append("file", file);
    data.append("body", JSON.stringify({
      classes : labels
    }));

    // Request
    axios
      .post(`/api/chunk-classify`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params : {
          "multi_label" : multiLabel
        }
      })
      .then((response) => {
        handleWsResponse(response.data);
      })
      .catch((_err) => setIsError(true));
  };

  return {
    makeRequest,
    isError,
    progress: job?.progress || 0.0,
    status: job?.status || "pending",
    result_uri: job?.result_uri,
  };

}