from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    difficulty = Column(String, default="Medium")
    tech_stack = Column(String, default="General")
    
    questions = relationship("Question", back_populates="session")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"))
    question_text = Column(Text, nullable=False)
    difficulty = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False)

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    user_answer = Column(Text, nullable=False)
    feedback_json = Column(JSON, nullable=False) # Stores the full evaluation JSON
    score_correctness = Column(Integer)
    score_efficiency = Column(Integer)
    score_clarity = Column(Integer)
    overall_assessment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question", back_populates="answer")
