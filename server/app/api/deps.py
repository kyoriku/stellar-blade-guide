from typing import Generator
from sqlalchemy.orm import Session
from app.core.database import get_db_session

def get_db() -> Generator[Session, None, None]:
    db = get_db_session()
    try:
        yield db
    finally:
        db.close()