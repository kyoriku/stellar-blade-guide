# # import psycopg2
# # import os
# # from dotenv import load_dotenv

# # load_dotenv()

# # DATABASE_URL = os.getenv('DATABASE_URL')

# # def get_db_connection():
# #     conn = psycopg2.connect(DATABASE_URL)
# #     return conn

# import os
# from dotenv import load_dotenv
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, Session
# from contextlib import contextmanager

# load_dotenv()

# DATABASE_URL = os.getenv('DATABASE_URL')

# engine = create_engine(DATABASE_URL, echo=False)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# @contextmanager
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#         db.commit()
#     except Exception:
#         db.rollback()
#         raise
#     finally:
#         db.close()

# def get_db_session() -> Session:
#     return SessionLocal()

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def get_db_session() -> Session:
    return SessionLocal()