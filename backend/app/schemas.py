from pydantic import BaseModel, ConfigDict, Field, HttpUrl

class TopicCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = ""

class TopicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    lesson_count: int = 0
    completed_count: int = 0
    note_count: int = 0
    progress: int = 0

class LessonCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)

class LessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    topic_id: int
    title: str
    is_completed: bool

class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = ""

class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    topic_id: int
    title: str
    content: str

class ResourceCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: HttpUrl

class ResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    topic_id: int
    title: str
    url: str
