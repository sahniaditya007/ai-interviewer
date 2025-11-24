from pydantic import BaseModel, Field
from typing import Literal, Optional, List
from datetime import datetime

class QuestionCreate(BaseModel):
    difficulty: Literal["Easy", "Medium", "Hard"]

class QuestionResponse(BaseModel):
    id: int
    question_text: str
    difficulty: str
    created_at: datetime

    class Config:
        from_attributes = True

class AnswerCreate(BaseModel):
    question_id: int
    user_answer: str

class EvaluationResponse(BaseModel):
    score_correctness: int
    score_efficiency: int
    score_clarity: int
    feedback: str
    overall_assessment: str

class AnswerResponse(BaseModel):
    id: int
    user_answer: str
    feedback_json: EvaluationResponse
    created_at: datetime

    class Config:
        from_attributes = True

class SessionCreate(BaseModel):
    difficulty: str = "Medium"
    tech_stack: str = "General"

class SessionResponse(BaseModel):
    id: int
    created_at: datetime
    difficulty: str
    tech_stack: str
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True
