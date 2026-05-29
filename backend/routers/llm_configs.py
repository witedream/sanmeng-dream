from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import LLMConfig
from schemas import LLMConfigCreate, LLMConfigUpdate, LLMConfigResponse

router = APIRouter(prefix="/api/llm-configs", tags=["llm-configs"])


@router.get("", response_model=List[LLMConfigResponse])
def list_llm_configs(db: Session = Depends(get_db)):
    return db.query(LLMConfig).order_by(LLMConfig.updated_at.desc()).all()


@router.get("/default", response_model=LLMConfigResponse)
def get_default_config(db: Session = Depends(get_db)):
    config = db.query(LLMConfig).filter(LLMConfig.is_default == True).first()
    if not config:
        config = db.query(LLMConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="没有可用的LLM配置")
    return config


@router.get("/{config_id}", response_model=LLMConfigResponse)
def get_llm_config(config_id: int, db: Session = Depends(get_db)):
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
    return config


@router.post("", response_model=LLMConfigResponse)
def create_llm_config(data: LLMConfigCreate, db: Session = Depends(get_db)):
    if data.is_default:
        db.query(LLMConfig).filter(LLMConfig.is_default == True).update({"is_default": False})
    config = LLMConfig(**data.model_dump())
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


@router.put("/{config_id}", response_model=LLMConfigResponse)
def update_llm_config(config_id: int, data: LLMConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
    update_data = data.model_dump(exclude_unset=True)
    if update_data.get("is_default"):
        db.query(LLMConfig).filter(LLMConfig.is_default == True, LLMConfig.id != config_id).update({"is_default": False})
    for key, val in update_data.items():
        setattr(config, key, val)
    db.commit()
    db.refresh(config)
    return config


@router.delete("/{config_id}")
def delete_llm_config(config_id: int, db: Session = Depends(get_db)):
    config = db.query(LLMConfig).filter(LLMConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
    db.delete(config)
    db.commit()
    return {"message": "删除成功"}
