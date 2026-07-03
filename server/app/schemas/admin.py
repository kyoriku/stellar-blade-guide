from pydantic import BaseModel


class SeedResponse(BaseModel):
    status: str
    message: str
    details: dict = {}
