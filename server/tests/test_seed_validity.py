from __future__ import annotations

import json
from pathlib import Path
from typing import List, Literal, Optional, Union

import pytest
from pydantic import BaseModel

from schemas.walkthroughs import Walkthrough

SEED_DATA_DIR = Path(__file__).parent.parent / "seed-data"
WALKTHROUGHS_DIR = SEED_DATA_DIR / "walkthroughs"
COLLECTIBLES_DIR = SEED_DATA_DIR / "collectibles"

_walkthrough_files = sorted(WALKTHROUGHS_DIR.rglob("*.json")) if WALKTHROUGHS_DIR.exists() else []
_collectible_files = sorted(COLLECTIBLES_DIR.glob("*/*.json")) if COLLECTIBLES_DIR.exists() else []


class _TextDescription(BaseModel):
    type: Literal["text"]
    content: str


class _ListDescription(BaseModel):
    type: Literal["list"]
    items: List[str]


class _SeedImage(BaseModel):
    url: str
    alt: str
    order: int


class _SeedCollectible(BaseModel):
    id: int
    level: str
    location: str
    types: Union[str, List[str]]
    title: str
    description: Union[str, List[str], _TextDescription, _ListDescription]
    display_order: int = 0
    images: List[_SeedImage] = []
    quantity: int = 1
    cycle: str = "Base"
    subtype: Optional[str] = None


@pytest.mark.parametrize(
    "json_path",
    _walkthrough_files,
    ids=[str(p.relative_to(SEED_DATA_DIR)) for p in _walkthrough_files],
)
def test_walkthrough_seed_valid(json_path: Path) -> None:
    data = json.loads(json_path.read_text())
    Walkthrough.model_validate(data)


@pytest.mark.parametrize(
    "json_path",
    _collectible_files,
    ids=[str(p.relative_to(SEED_DATA_DIR)) for p in _collectible_files],
)
def test_collectible_seed_valid(json_path: Path) -> None:
    data = json.loads(json_path.read_text())
    assert isinstance(data, list), f"{json_path.name} must contain a JSON array"
    for item in data:
        _SeedCollectible.model_validate(item)
