from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Character
from schemas import CharacterCreate, CharacterUpdate, CharacterResponse

router = APIRouter(prefix="/api/characters", tags=["characters"])


@router.get("", response_model=List[CharacterResponse])
def list_characters(db: Session = Depends(get_db)):
    return db.query(Character).order_by(Character.updated_at.desc()).all()


@router.get("/{character_id}", response_model=CharacterResponse)
def get_character(character_id: int, db: Session = Depends(get_db)):
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")
    return char


@router.post("", response_model=CharacterResponse)
def create_character(data: CharacterCreate, db: Session = Depends(get_db)):
    char = Character(**data.model_dump())
    db.add(char)
    db.commit()
    db.refresh(char)
    return char


@router.put("/{character_id}", response_model=CharacterResponse)
def update_character(character_id: int, data: CharacterUpdate, db: Session = Depends(get_db)):
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(char, key, val)
    db.commit()
    db.refresh(char)
    return char


@router.delete("/{character_id}")
def delete_character(character_id: int, db: Session = Depends(get_db)):
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="角色不存在")
    db.delete(char)
    db.commit()
    return {"message": "删除成功"}
