from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import httpx
import json

from database import get_db
from models import ChatSession, ChatMessage, Character, LLMConfig, WorldBook
from schemas import (
    ChatSessionCreate, ChatSessionResponse, ChatSessionDetail,
    ChatMessageResponse, SendMessage
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


# === Session CRUD ===
@router.get("/sessions", response_model=List[ChatSessionResponse])
def list_sessions(character_id: int = 0, db: Session = Depends(get_db)):
    query = db.query(ChatSession).order_by(ChatSession.updated_at.desc())
    if character_id:
        query = query.filter(ChatSession.character_id == character_id)
    return query.all()


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()
    character = db.query(Character).filter(Character.id == session.character_id).first()
    llm_config = None
    if session.llm_config_id:
        llm_config = db.query(LLMConfig).filter(LLMConfig.id == session.llm_config_id).first()
    return ChatSessionDetail(
        **{k: getattr(session, k) for k in
           ["id", "character_id", "llm_config_id", "title", "summary", "context", "is_active", "created_at",
            "updated_at"]},
        messages=[ChatMessageResponse(**{k: getattr(m, k) for k in ["id", "session_id", "role", "content", "created_at"]})
                  for m in messages],
        character=character,
        llm_config=llm_config
    )


@router.post("/sessions", response_model=ChatSessionDetail)
def create_session(data: ChatSessionCreate, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == data.character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")

    llm_config_id = data.llm_config_id
    if not llm_config_id:
        default_config = db.query(LLMConfig).filter(LLMConfig.is_default == True).first()
        if not default_config:
            default_config = db.query(LLMConfig).first()
        if default_config:
            llm_config_id = default_config.id

    session = ChatSession(
        character_id=data.character_id,
        llm_config_id=llm_config_id,
        title=data.title or f"和{character.name}的对话",
        context=data.context or "",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at).all()

    return ChatSessionDetail(
        **{k: getattr(session, k) for k in
           ["id", "character_id", "llm_config_id", "title", "summary", "context", "is_active", "created_at",
            "updated_at"]},
        messages=[ChatMessageResponse(**{k: getattr(m, k) for k in ["id", "session_id", "role", "content", "created_at"]})
                  for m in messages],
        character=character,
        llm_config=db.query(LLMConfig).filter(LLMConfig.id == llm_config_id).first() if llm_config_id else None
    )


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    db.delete(session)
    db.commit()
    return {"message": "删除成功"}


@router.put("/sessions/{session_id}/title")
def update_session_title(session_id: int, data: dict, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")
    session.title = data.get("title", session.title)
    db.commit()
    return {"message": "更新成功"}


# === Messages ===
@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def list_messages(session_id: int, db: Session = Depends(get_db)):
    return db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()


def build_system_prompt(character: Character, worldbooks: list[WorldBook], context: str = "") -> str:
    parts = []

    if character.system_prompt:
        parts.append(character.system_prompt)

    parts.append(f"你现在扮演【{character.name}】。")

    if character.personality:
        parts.append(f"【{character.name}的性格】：{character.personality}")

    if character.appearance:
        parts.append(f"【{character.name}的外貌】：{character.appearance}")

    if character.backstory:
        parts.append(f"【{character.name}的背景故事】：{character.backstory}")

    if character.example_dialogue:
        parts.append(f"【{character.name}的对话示例】：\n{character.example_dialogue}")

    active_worldbooks = [wb for wb in worldbooks if wb.is_active]
    if active_worldbooks:
        world_text = "\n\n".join([f"【{wb.title}】\n{wb.content}" for wb in active_worldbooks])
        parts.append(f"【世界观设定】\n{world_text}")

    if context:
        parts.append(f"【额外上下文】\n{context}")

    parts.append(f"请完全代入{character.name}的角色，用{character.name}的语气、习惯和视角回应。不要跳出角色，不要提到你是一个AI或语言模型。")

    return "\n\n".join(parts)


@router.post("/sessions/{session_id}/send", response_model=ChatMessageResponse)
async def send_message(session_id: int, data: SendMessage, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    character = db.query(Character).filter(Character.id == session.character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="角色不存在")

    # Save user message
    user_msg = ChatMessage(session_id=session_id, role="user", content=data.content)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Get LLM config
    llm_config = None
    if session.llm_config_id:
        llm_config = db.query(LLMConfig).filter(LLMConfig.id == session.llm_config_id).first()
    if not llm_config:
        llm_config = db.query(LLMConfig).filter(LLMConfig.is_default == True).first()
    if not llm_config:
        llm_config = db.query(LLMConfig).first()
    if not llm_config:
        raise HTTPException(status_code=500, detail="没有可用的LLM配置，请先在设置中添加")

    # Build context
    worldbooks = db.query(WorldBook).all()
    system_prompt = build_system_prompt(character, worldbooks, session.context or "")

    # Get chat history
    history_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()

    # Build OpenAI-compatible request
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history_messages[:-1]:  # exclude the just-saved user message, include it normally
        role = "assistant" if msg.role == "assistant" else "user"
        messages.append({"role": role, "content": msg.content})
    messages.append({"role": "user", "content": data.content})

    # Call LLM
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            request_body = {
                "model": llm_config.model,
                "messages": messages,
                "max_tokens": llm_config.max_tokens,
                "temperature": llm_config.temperature,
                "top_p": llm_config.top_p,
                "stream": False,
            }

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {llm_config.api_key}",
            }

            response = await client.post(
                f"{llm_config.base_url.rstrip('/')}/chat/completions",
                json=request_body,
                headers=headers,
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"LLM请求失败 ({response.status_code}): {response.text[:500]}"
                )

            result = response.json()
            assistant_content = result["choices"][0]["message"]["content"]

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="LLM请求超时，请检查网络或更换模型")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM请求出错: {str(e)}")

    # Save assistant message
    assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=assistant_content)
    db.add(assistant_msg)

    # Update session title if it's the first exchange
    session_title = session.title
    if session.title == "新对话" and len(history_messages) <= 2:
        session.title = f"{character.name} - {data.content[:30]}{'...' if len(data.content) > 30 else ''}"

    session.updated_at = db.engine.execute(db.text("SELECT CURRENT_TIMESTAMP")).scalar()
    db.commit()
    db.refresh(assistant_msg)

    return ChatMessageResponse(
        id=assistant_msg.id,
        session_id=assistant_msg.session_id,
        role=assistant_msg.role,
        content=assistant_msg.content,
        created_at=assistant_msg.created_at,
    )
