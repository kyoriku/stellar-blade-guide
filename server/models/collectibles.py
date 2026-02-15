from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from db.database import Base

# Junction table for many-to-many relationship
collectible_type_mappings = Table(
    'collectible_type_mappings',
    Base.metadata,
    Column('collectible_id', Integer, ForeignKey('collectibles.id', ondelete='CASCADE'), primary_key=True),
    Column('type_id', Integer, ForeignKey('collectible_types.id', ondelete='CASCADE'), primary_key=True)
)

class Level(Base):
    __tablename__ = 'levels'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    display_order = Column(Integer, nullable=False)
    
    locations = relationship('Location', back_populates='level', cascade='all, delete-orphan')

class Location(Base):
    __tablename__ = 'locations'
    
    id = Column(Integer, primary_key=True)
    level_id = Column(Integer, ForeignKey('levels.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(100), nullable=False)
    display_order = Column(Integer, nullable=False)
    
    level = relationship('Level', back_populates='locations')
    collectibles = relationship('Collectible', back_populates='location', cascade='all, delete-orphan')

# class CollectibleType(Base):
#     __tablename__ = 'collectible_types'
    
#     id = Column(Integer, primary_key=True)
#     name = Column(String(50), unique=True, nullable=False)
#     category_group = Column(String(50), nullable=False)
#     display_order = Column(Integer, nullable=False, default=0)
    
#     collectibles = relationship('Collectible', secondary=collectible_type_mappings, back_populates='types')
class CollectibleType(Base):
    __tablename__ = 'collectible_types'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    category_group = Column(String(50), nullable=True)  # nullable during migration
    display_order = Column(Integer, nullable=True)  # nullable during migration
    
    collectibles = relationship('Collectible', secondary=collectible_type_mappings, back_populates='types')

class Collectible(Base):
    __tablename__ = 'collectibles'
    
    id = Column(Integer, primary_key=True)
    location_id = Column(Integer, ForeignKey('locations.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(JSONB, nullable=False)
    display_order = Column(Integer, nullable=False)
    
    location = relationship('Location', back_populates='collectibles')
    # Many-to-many relationship with types
    types = relationship('CollectibleType', secondary=collectible_type_mappings, back_populates='collectibles')
    images = relationship('CollectibleImage', back_populates='collectible', cascade='all, delete-orphan', order_by='CollectibleImage.display_order')

class CollectibleImage(Base):
    __tablename__ = 'collectible_images'
    
    id = Column(Integer, primary_key=True)
    collectible_id = Column(Integer, ForeignKey('collectibles.id', ondelete='CASCADE'), nullable=False)
    cloudinary_url = Column(String(500), nullable=False)
    alt_text = Column(String(255), nullable=False)
    display_order = Column(Integer, nullable=False)
    
    collectible = relationship('Collectible', back_populates='images')