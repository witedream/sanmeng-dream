from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# === Character Schemas ===
class CharacterBase(BaseModel):
    name: str
    avatar: str = ""
    appearance: str = ""
    personality: str = ""
    backstory: str = ""
    greeting: str = ""
    example_dialogue: str = ""
    system_prompt: str = ""
    is_active: bool = True


class CharacterCreate(CharacterBase):
    pass


class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    appearance: Optional[str] = None
    personality: Optional[str] = None
    backstory: Optional[str] = None
    greeting: Optional[str] = None
    example_dialogue: Optional[str] = None
    system_prompt: Optional[str] = None
    is_active: Optional[bool] = None


class CharacterResponse(CharacterBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# === WorldBook Schemas ===
class WorldBookBase(BaseModel):
    title: str
    content: str = ""
    tags: str = ""
    category: str = "general"
    is_active: bool = True


class WorldBookCreate(WorldBookBase):
    pass


class WorldBookUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class WorldBookResponse(WorldBookBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# === LLMConfig Schemas ===
class LLMConfigBase(BaseModel):
    name: str
    provider: str = "custom"
    base_url: str = "https://api.openai.com/v1"
    api_key: str = ""
    model: str = "gpt-3.5-turbo"
    max_tokens: int = 2048
    temperature: float = 0.7
    top_p: float = 0.9
    is_active: bool = True
    is_default: bool = False


class LLMConfigCreate(LLMConfigBase):
    pass


class LLMConfigUpdate(BaseModel):
    name: Optional[str] = None
    provider: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class LLMConfigResponse(LLMConfigBase):
    id: int
    api_key: str = ""
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# === Chat Schemas ===
class ChatSessionBase(BaseModel):
    character_id: int
    llm_config_id: Optional[int] = None
    title: str = "新对话"
    context: str = ""


class ChatSessionCreate(ChatSessionBase):
    pass


class ChatSessionResponse(ChatSessionBase):
    id: int
    summary: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    role: str
    content: str


class ChatMessageResponse(ChatMessageBase):
    id: int
    session_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SendMessage(BaseModel):
    content: str


class ChatSessionDetail(ChatSessionResponse):
    messages: list[ChatMessageResponse] = []
    character: Optional[CharacterResponse] = None
    llm_config: Optional[LLMConfigResponse] = None
