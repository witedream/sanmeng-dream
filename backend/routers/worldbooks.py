from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import WorldBook
from schemas import WorldBookCreate, WorldBookUpdate, WorldBookResponse

router = APIRouter(prefix="/api/worldbooks", tags=["worldbooks"])


@router.get("", response_model=List[WorldBookResponse])
def list_worldbooks(category: str = "", db: Session = Depends(get_db)):
    query = db.query(WorldBook).order_by(WorldBook.updated_at.desc())
    if category:
        query = query.filter(WorldBook.category == category)
    return query.all()


@router.get("/{wb_id}", response_model=WorldBookResponse)
def get_worldbook(wb_id: int, db: Session = Depends(get_db)):
    wb = db.query(WorldBook).filter(WorldBook.id == wb_id).first()
    if not wb:
        raise HTTPException(status_code=404, detail="世界书条目不存在")
    return wb


@router.post("", response_model=WorldBookResponse)
def create_worldbook(data: WorldBookCreate, db: Session = Depends(get_db)):
    wb = WorldBook(**data.model_dump())
    db.add(wb)
    db.commit()
    db.refresh(wb)
    return wb


@router.put("/{wb_id}", response_model=WorldBookResponse)
def update_worldbook(wb_id: int, data: WorldBookUpdate, db: Session = Depends(get_db)):
    wb = db.query(WorldBook).filter(WorldBook.id == wb_id).first()
    if not wb:
        raise HTTPException(status_code=404, detail="世界书条目不存在")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(wb, key, val)
    db.commit()
    db.refresh(wb)
    return wb


@router.delete("/{wb_id}")
def delete_worldbook(wb_id: int, db: Session = Depends(get_db)):
    wb = db.query(WorldBook).filter(WorldBook.id == wb_id).first()
    if not wb:
        raise HTTPException(status_code=404, detail="世界书条目不存在")
    db.delete(wb)
    db.commit()
    return {"message": "删除成功"}
