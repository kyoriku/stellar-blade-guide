from pydantic import BaseModel
from typing import Literal, List, Union, Optional

class TextDescription(BaseModel):
    type: Literal["text"]
    content: str

class ListDescription(BaseModel):
    type: Literal["list"]
    items: List[str]

class CollectibleImageSchema(BaseModel):
    cloudinary_url: str
    alt_text: str
    display_order: int

class CollectibleImageResponse(BaseModel):
    id: int
    url: str
    alt: str
    order: int

class CollectibleCreate(BaseModel):
    location_id: int
    type_ids: List[int]
    title: str
    description: Union[TextDescription, ListDescription]
    display_order: int
    images: List[CollectibleImageSchema]

class CollectibleResponse(BaseModel):
    id: int
    title: str
    description: Union[TextDescription, ListDescription]
    display_order: int
    types: List[str]
    images: List[CollectibleImageResponse]

class CollectibleWithLocationResponse(CollectibleResponse):
    level: str
    location: str

class LevelResponse(BaseModel):
    id: int
    name: str
    display_order: int

class LocationResponse(BaseModel):
    id: int
    name: str
    display_order: int

class TypeResponse(BaseModel):
    id: int
    name: str
    category_group: Optional[str] = None
    display_order: Optional[int] = None