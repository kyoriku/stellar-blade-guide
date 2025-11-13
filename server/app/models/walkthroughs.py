# from sqlalchemy import Column, Integer, String, ForeignKey
# from sqlalchemy.dialects.postgresql import JSONB
# from app.core.database import Base

# class Walkthrough(Base):
#     __tablename__ = 'walkthroughs'
    
#     id = Column(Integer, primary_key=True)
#     type = Column(String(50), nullable=False)  # main_story, side_quest, boss, etc.
#     level = Column(String(100), nullable=True)
#     title = Column(String(255), nullable=False)
#     subtitle = Column(String(255), nullable=True)
#     prerequisites = Column(JSONB, nullable=True)  # Array of strings
#     rewards = Column(JSONB, nullable=True)  # Array of strings
#     steps = Column(JSONB, nullable=False)  # Full steps array
#     display_order = Column(Integer, nullable=False)






from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base

class Walkthrough(Base):
    __tablename__ = 'walkthroughs'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    subtitle = Column(String(255), nullable=True)
    level = Column(String(100), nullable=True)
    mission_type = Column(String(50), nullable=False)  # main_story, side_quest, etc.
    objectives = Column(JSONB, nullable=True)  # Array of strings
    content = Column(JSONB, nullable=False)  # Array of content blocks
    display_order = Column(Integer, nullable=False)