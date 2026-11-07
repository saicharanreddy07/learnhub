from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class Topic(Base):
    __tablename__ = "topics"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    lessons = relationship("Lesson", back_populates="topic", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="topic", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="topic", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    topic = relationship("Topic", back_populates="lessons")

class Note(Base):
    __tablename__ = "notes"
    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    topic = relationship("Topic", back_populates="notes")

class Resource(Base):
    __tablename__ = "resources"
    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    topic = relationship("Topic", back_populates="resources")
