from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, Float, Enum
from src.enums import JobStatus

Base = declarative_base()

class Job(Base):

    __tablename__ = 'jobs'

    id = Column(String, primary_key = True, index = True)
    status = Column(Enum(JobStatus))
    progress = Column(Float, default = 0.0)
    result_uri = Column(String)