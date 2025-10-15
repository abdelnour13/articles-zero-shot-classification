from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DB_URL = "sqlite:///src/db/sql.db"

engine = create_engine(
    url = DB_URL,
    connect_args = {
        "check_same_thread" : False
    }
)

SessionLocal = sessionmaker(bind = engine)