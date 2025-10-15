from pydantic import BaseModel
from typing import List
from src.enums import JobStatus

class Job(BaseModel):

    id : str
    status : JobStatus
    progress : float
    result_uri : str

    class Config:
        from_attributes : bool = True

class Document(BaseModel):
    id : str
    text : str

class Label(BaseModel):
    name : str
    description : str

class ClassifyRequestBody(BaseModel):
    documents : List[Document]
    classes : List[Label]

class ChunkClassifyRequestBody(BaseModel):
    classes : List[Label]