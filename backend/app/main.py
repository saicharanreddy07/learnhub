from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from .database import Base, engine, get_db
from . import models, schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LearnHub API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def topic_summary(topic: models.Topic):
    total = len(topic.lessons)
    completed = sum(1 for lesson in topic.lessons if lesson.is_completed)
    return {
        "id": topic.id,
        "title": topic.title,
        "description": topic.description,
        "lesson_count": total,
        "completed_count": completed,
        "note_count": len(topic.notes),
        "progress": round(completed / total * 100) if total else 0,
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/topics")
def list_topics(db: Session = Depends(get_db)):
    topics = db.scalars(select(models.Topic).order_by(models.Topic.created_at.desc())).all()
    return [topic_summary(topic) for topic in topics]

@app.post("/api/topics", status_code=status.HTTP_201_CREATED)
def create_topic(payload: schemas.TopicCreate, db: Session = Depends(get_db)):
    topic = models.Topic(title=payload.title.strip(), description=payload.description.strip())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic_summary(topic)

@app.get("/api/topics/{topic_id}")
def get_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.get(models.Topic, topic_id)
    if not topic:
        raise HTTPException(404, "Topic not found")
    return topic_summary(topic)

@app.delete("/api/topics/{topic_id}", status_code=204)
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.get(models.Topic, topic_id)
    if not topic:
        raise HTTPException(404, "Topic not found")
    db.delete(topic)
    db.commit()

@app.get("/api/topics/{topic_id}/lessons", response_model=list[schemas.LessonOut])
def list_lessons(topic_id: int, db: Session = Depends(get_db)):
    if not db.get(models.Topic, topic_id):
        raise HTTPException(404, "Topic not found")
    return db.scalars(select(models.Lesson).where(models.Lesson.topic_id == topic_id).order_by(models.Lesson.id)).all()

@app.post("/api/topics/{topic_id}/lessons", response_model=schemas.LessonOut, status_code=201)
def create_lesson(topic_id: int, payload: schemas.LessonCreate, db: Session = Depends(get_db)):
    if not db.get(models.Topic, topic_id):
        raise HTTPException(404, "Topic not found")
    lesson = models.Lesson(topic_id=topic_id, title=payload.title.strip())
    db.add(lesson); db.commit(); db.refresh(lesson)
    return lesson

@app.patch("/api/lessons/{lesson_id}")
def update_lesson(lesson_id: int, is_completed: bool, db: Session = Depends(get_db)):
    lesson = db.get(models.Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    lesson.is_completed = is_completed
    db.commit(); db.refresh(lesson)
    return lesson

@app.delete("/api/lessons/{lesson_id}", status_code=204)
def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.get(models.Lesson, lesson_id)
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    db.delete(lesson); db.commit()

@app.get("/api/topics/{topic_id}/notes", response_model=list[schemas.NoteOut])
def list_notes(topic_id: int, db: Session = Depends(get_db)):
    if not db.get(models.Topic, topic_id):
        raise HTTPException(404, "Topic not found")
    return db.scalars(select(models.Note).where(models.Note.topic_id == topic_id).order_by(models.Note.updated_at.desc())).all()

@app.post("/api/topics/{topic_id}/notes", response_model=schemas.NoteOut, status_code=201)
def create_note(topic_id: int, payload: schemas.NoteCreate, db: Session = Depends(get_db)):
    if not db.get(models.Topic, topic_id):
        raise HTTPException(404, "Topic not found")
    note = models.Note(topic_id=topic_id, title=payload.title.strip(), content=payload.content)
    db.add(note); db.commit(); db.refresh(note)
    return note

@app.put("/api/notes/{note_id}", response_model=schemas.NoteOut)
def update_note(note_id: int, payload: schemas.NoteCreate, db: Session = Depends(get_db)):
    note = db.get(models.Note, note_id)
    if not note:
        raise HTTPException(404, "Note not found")
    note.title = payload.title.strip()
    note.content = payload.content
    db.commit(); db.refresh(note)
    return note

@app.delete("/api/notes/{note_id}", status_code=204)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.get(models.Note, note_id)
    if not note:
        raise HTTPException(404, "Note not found")
    db.delete(note); db.commit()

@app.get("/api/topics/{topic_id}/resources", response_model=list[schemas.ResourceOut])
def list_resources(topic_id: int, db: Session = Depends(get_db)):
    if not db.get(models.Topic, topic_id):
        raise HTTPException(404, "Topic not found")
    return db.scalars(select(models.Resource).where(models.Resource.topic_id == topic_id).order_by(models.Resource.id.desc())).all()

@app.post("/api/topics/{topic_id}/resources", response_model=schemas.ResourceOut, status_code=201)
def create_resource(topic_id: int, payload: schemas.ResourceCreate, db: Session = Depends(get_db)):
    if not db.get(models.Topic, topic_id):
        raise HTTPException(404, "Topic not found")
    resource = models.Resource(topic_id=topic_id, title=payload.title.strip(), url=str(payload.url))
    db.add(resource); db.commit(); db.refresh(resource)
    return resource
