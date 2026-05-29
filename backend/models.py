from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    avatar = Column(Text, default="")
    appearance = Column(Text, default="")
    personality = Column(Text, default="")
    backstory = Column(Text, default="")
    greeting = Column(Text, default="")
    example_dialogue = Column(Text, default="")
    system_prompt = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    chat_sessions = relationship("ChatSession", back_populates="character", cascade="all, delete-orphan")


class WorldBook(Base):
    __tablename__ = "world_books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, default="")
    tags = Column(Text, default="")
    category = Column(String(100), default="general")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class LLMConfig(Base):
    __tablename__ = "llm_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    provider = Column(String(100), default="custom")
    base_url = Column(String(500), default="https://api.openai.com/v1")
    api_key = Column(Text, default="")
    model = Column(String(200), default="gpt-3.5-turbo")
    max_tokens = Column(Integer, default=2048)
    temperature = Column(Float, default=0.7)
    top_p = Column(Float, default=0.9)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False)
    llm_config_id = Column(Integer, ForeignKey("llm_configs.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), default="新对话")
    summary = Column(Text, default="")
    context = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    character = relationship("Character", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("ChatSession", back_populates="messages")
