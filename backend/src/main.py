import os
import asyncio
import pandas as pd
import sys
import json
import pandas as pd
import regex
import sys
import redis.asyncio as redis
sys.path.append('..')
from transformers import pipeline, Pipeline
from datasets import Dataset
from typing import Dict, List
from fastapi import (
    FastAPI, 
    Depends, 
    Body, 
    Query, 
    status, 
    UploadFile, 
    File, 
    HTTPException, 
    Form, 
    Path,
    WebSocket,
)
from fastapi.background import BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from src import models
from src.db import engine, SessionLocal
from src.schemas import Label, ClassifyRequestBody, ChunkClassifyRequestBody, Job, JobStatus, Document
from src.constants import BATCH_SIZE, MODEL_NAME, CHUNK_SIZE, RESULTS_DIR, PUBLIC_DIR
from src.utils import get_df_from_csv
from sqlalchemy.orm import Session
from src.crud import get_job, create_job

### Create the APP
app = FastAPI()
r = redis.Redis(host="redis", port="6379")

### Database
models.Base.metadata.create_all(bind = engine)

def get_db():

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

### Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/public", StaticFiles(directory=PUBLIC_DIR), name="public")

### Global 
G = dict()

### Load the model
def load_model() -> Pipeline:

    if "model" not in G:

        pipe = pipeline(
            task = "zero-shot-classification",
            model = MODEL_NAME,
        )

        G["model"] = pipe

    return G["model"]

### Job functions
JOBS = dict()

### Utils
async def classify_documents(
    pipe : Pipeline,
    documents : List[Document],
    labels : List[Label],
    multi_label : bool,
    batch_size : str,
) -> List[Dict]:
    
    ids = [doc.id for doc in documents]
    texts = [doc.text for doc in documents]
    
    dataset = Dataset.from_dict({ "id" : ids, "text" : texts })
    classes = list(map(lambda label : f"{label.name} : {label.description}", labels))
    results = []

    for batch in dataset.iter(batch_size = batch_size, drop_last_batch = False):

        ### Make Predictions
        predictions = pipe(batch["text"], classes, multi_label = multi_label)

        ### Update Results
        results.extend([
            {
                "id" : id,
                **
                {
                    label.name : score
                    for label, score in zip(labels, doc["scores"])
                }
            }
            for id,doc in zip(batch["id"], predictions)
        ])

    return results

async def chunk_classify_documents(
    pipe : Pipeline,
    documents : pd.DataFrame,
    labels : List[Label],
    multi_label : bool,
    batch_size : str,
    job : Job,
) -> None:
        
    await asyncio.sleep(10)
        
    try:

        ### Setup the dataset
        dataset = Dataset.from_dict({ 
            "id" : documents["id"].to_list(),
            "text" : documents["abstract"].to_list() 
        })

        classes = list(map(lambda label : f"{label.name} : {label.description}", labels))
        results = []        

        ### Chunk id
        chunk_id : int = 0

        for i,batch in enumerate(dataset.iter(batch_size = batch_size, drop_last_batch = False)):

            ### Make Predictions
            predictions = pipe(batch["text"], classes, multi_label = multi_label)

            ### Update Job
            job.progress += (len(predictions) / len(documents))
            job.status = JobStatus.PROCESSING

            await r.publish(f"job_{job.id}", json.dumps({
                "id" : job.id,
                "status" : job.status.value,
                "progress" : job.progress,
                "result_uri" : job.result_uri
            }))
            
            ### Update Results
            results.extend([
                {
                    "id" : id,
                    **{
                        label.name : score
                        for label, score in zip(labels, doc["scores"])
                    }
                }
                for id,doc in zip(batch["id"], predictions)
            ])

            ### SAVE CHUNK
            if len(results) >= CHUNK_SIZE:

                filename = os.path.join(RESULTS_DIR, f"predictions_{job.id}_{chunk_id}.csv")
                df = pd.DataFrame(data = results)

                if not multi_label:
                    df["Predicted Class"] = df.idxmax(1)
                else:
                    df["Labels"] = []

                df.to_csv(filename, index = False)
                results = []
                chunk_id += 1

        ### SAVE Last chunk
        if len(results) > 0:
            filename = os.path.join(RESULTS_DIR, f"predictions_{job.id}_{chunk_id}.csv")
            df = pd.DataFrame(data = results)
            df.to_csv(filename, index = False)

        job.progress = 1.0
        job.status = JobStatus.COMPLETED

    except:
        job.status = JobStatus.FAILED

    await r.publish(f"job_{job.id}", json.dumps({
        "id" : job.id,
        "status" : job.status.value,
        "progress" : job.progress,
        "result_uri" : job.result_uri
    }))


### Endpoints
@app.post("/classify", status_code = status.HTTP_202_ACCEPTED)
async def classify(
    data : ClassifyRequestBody = Body(),
    model : Pipeline = Depends(load_model),
    multi_label : bool = Query(default = False)
) -> List[Dict]:
        
    results = await classify_documents(
        pipe = model,
        documents = data.documents,
        labels = data.classes,
        multi_label = multi_label,
        batch_size = BATCH_SIZE
    )

    return results

@app.post("/chunk-classify", status_code = status.HTTP_202_ACCEPTED)
async def chunk_classify(
    background_tasks : BackgroundTasks,
    file : UploadFile = File(..., description = "A csv file with a maximum size of 20MB."),
    body : str = Form(..., description = "List of classes and their descriptions."),
    model : Pipeline = Depends(load_model),
    multi_label : bool = Query(default = False),
    db : Session = Depends(get_db)
) -> Job:
    
    body : ChunkClassifyRequestBody = ChunkClassifyRequestBody(**json.loads(body))

    documents = get_df_from_csv(file)
    
    ### Create the job
    job = create_job(db = db, result_uri = lambda id : f"/results/{id}")

    ### Create a task
    background_tasks.add_task(
        chunk_classify_documents, 
        pipe = model,
        documents = documents,
        labels = body.classes,
        multi_label = multi_label,
        batch_size = BATCH_SIZE,
        job = job,
    )

    ### return job details
    return job

@app.get('/metadata')
async def get_metadata() -> Dict:

    return {
        'BATCH_SIZE' : BATCH_SIZE, 
        'MODEL_NAME' : MODEL_NAME,
    }

@app.get("/jobs/{job_id}", status_code = status.HTTP_200_OK)
async def retreive_job(
    job_id : str = Path(),
    db : Session = Depends(get_db)
) -> Job:

    job = get_job(db, job_id)

    if job is None:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = {
                "message" : f"Job with id = {job_id} was not found",
                "id" : job_id
            }
        )
    
    return job

@app.get("/results/{job_id}", status_code = status.HTTP_200_OK)
async def retreive_results(
    job_id : str = Path(),
    chunk_id : int = Query(default = 0)
) -> Dict:
    
    ### Get All filenames
    files = os.listdir(RESULTS_DIR)
    pattern = f"predictions_{job_id}_" + r"\d" + ".csv"
    files = list(filter(lambda x : len(regex.findall(pattern = pattern, string = x)) > 0, files))
    files = list(sorted(files))

    ### Get the desired file
    filename = f"predictions_{job_id}_{chunk_id}.csv"

    if filename not in files:

        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = {
                "message" : f"File {filename} doesn't exist wrong chunk or job id",
                "job_id" : job_id,
                "chunk_id" : chunk_id
            }
        )
    
    ### Metadata
    idx = files.index(filename)
    is_their_next_chunk = idx < (len(files) - 1)

    next_chunk = None

    if is_their_next_chunk:
        next_chunk_id = int(files[idx + 1].split('.')[0].split('_')[-1])
        next_chunk = f"/public/results/{job_id}?chunk_id={next_chunk_id}"

    headers = {
        "X-Num-Chunks" : str(len(files)),
        "X-Next-Chunk" : next_chunk or "",
        "X-Is-Last-Chunk" : str(next_chunk is None)
    }

    file_path = os.path.join(RESULTS_DIR, filename)

    ### Return file
    return FileResponse(
        file_path,
        headers=headers,
        filename=filename,
        media_type="text/csv"
    )

# Notifications
@app.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str = Path()):

    await websocket.accept()

    pubsub = r.pubsub()
    await pubsub.subscribe(f"job_{job_id}")

    try:

        async for message in pubsub.listen():

            if message['type'] == 'message':
                
                job_data = message['data'].decode()
                job = json.loads(job_data)
                await websocket.send_json(job)

                if job["status"] in [JobStatus.COMPLETED.value, JobStatus.FAILED.value]:
                    break
    finally:

        await pubsub.unsubscribe(f"job_{job_id}")
        await websocket.close()