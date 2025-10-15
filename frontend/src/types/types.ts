export interface Label {
    name: string;
    description: string;
}

export type JobStatus = 
    | "pending"
    | "processing"
    | "completed"
    | "failed";

export interface Job {
    id: string;
    status : JobStatus;
    progress : number;
    result_uri : string;
}
  