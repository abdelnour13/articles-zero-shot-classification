import uuid
from src import models
from typing import Optional, Callable
from sqlalchemy.orm import Session
from src.enums import JobStatus

def create_job(db : Session, result_uri : Callable[[str], str]) -> models.Job:
    
    id = str(uuid.uuid4())

    job = models.Job(
        id = id,
        status = JobStatus.PENDING,
        progress = 0.0,
        result_uri = result_uri(id)
    )

    db.add(job)
    db.commit()

    return job

def get_job(db : Session, job_id : str) -> Optional[models.Job]:
    return db.query(models.Job).filter(models.Job.id == job_id).first()
    
def update_job(
    db : Session, 
    id : str, 
    progress : Optional[float] = None,
    status : Optional[JobStatus] = None
) -> Optional[models.Job]:

    job = get_job(db, id)

    if job is not None:

        if progress is not None:
            job.progress = progress

        if status is not None:
            job.status = status

        db.commit()
    
    return job