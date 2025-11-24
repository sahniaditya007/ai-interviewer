from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from .database import engine, Base, get_db
from .models import InterviewSession, Question, Answer
from .schemas import (
    SessionCreate, SessionResponse, QuestionResponse, 
    AnswerCreate, AnswerResponse, EvaluationResponse
)
from .services import interview_service


def determine_next_difficulty(session: InterviewSession, last_answer: Optional[Answer]) -> str:
    """Determine the next question difficulty based on the latest answer scores.

    This implements a simple adaptive rule so stronger performance leads to harder
    questions and weaker performance dials difficulty down.
    """
    base_difficulty = session.difficulty or "Medium"

    if not last_answer:
        return base_difficulty

    scores = [
        last_answer.score_correctness,
        last_answer.score_efficiency,
        last_answer.score_clarity,
    ]

    # If we don't have complete scores yet, fall back to the stored difficulty.
    if any(score is None for score in scores):
        return base_difficulty

    avg_score = sum(scores) / 3.0

    if avg_score >= 4.5:
        return "Hard"
    if avg_score >= 3.0:
        return "Medium"
    return "Easy"


app = FastAPI(title="AI Interviewer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "AI Interviewer API is running"}

@app.post("/sessions", response_model=SessionResponse)
async def create_session(session_data: SessionCreate, db: AsyncSession = Depends(get_db)):
    new_session = InterviewSession(
        difficulty=session_data.difficulty,
        tech_stack=session_data.tech_stack
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return SessionResponse(
        id=new_session.id,
        created_at=new_session.created_at,
        difficulty=new_session.difficulty,
        tech_stack=new_session.tech_stack,
        questions=[]
    )

@app.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewSession).offset(skip).limit(limit).order_by(InterviewSession.created_at.desc()))
    return [
        SessionResponse(
            id=s.id, created_at=s.created_at, difficulty=s.difficulty, tech_stack=s.tech_stack, questions=[]
        ) for s in result.scalars().all()
    ]

@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    result_q = await db.execute(select(Question).where(Question.session_id == session_id))
    questions = result_q.scalars().all()
    
    return SessionResponse(
        id=session.id,
        created_at=session.created_at,
        difficulty=session.difficulty,
        tech_stack=session.tech_stack,
        questions=questions
    )

@app.post("/sessions/{session_id}/questions", response_model=QuestionResponse)
async def generate_question_endpoint(
    session_id: int,
    difficulty: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    # Load session so we can adapt difficulty and respect tech stack.
    result = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # If the caller explicitly requested a difficulty, respect it.
    normalized = difficulty.capitalize() if difficulty else None
    if normalized not in {"Easy", "Medium", "Hard"}:
        # Look up the most recent answer for this session to drive adaptive difficulty.
        result_last = await db.execute(
            select(Answer)
            .join(Question, Answer.question_id == Question.id)
            .where(Question.session_id == session_id)
            .order_by(Answer.created_at.desc())
        )
        last_answer = result_last.scalars().first()
        next_difficulty = determine_next_difficulty(session, last_answer)
    else:
        next_difficulty = normalized

    try:
        generated_q = await interview_service.generate_question(next_difficulty, session.tech_stack)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Persist the latest difficulty so clients can display it.
    session.difficulty = next_difficulty
    db.add(session)

    new_question = Question(
        session_id=session_id,
        question_text=generated_q['question_text'],
        difficulty=generated_q['difficulty']
    )
    db.add(new_question)
    await db.commit()
    await db.refresh(new_question)
    return new_question

@app.post("/questions/{question_id}/answer", response_model=AnswerResponse)
async def submit_answer(question_id: int, answer_data: AnswerCreate, db: AsyncSession = Depends(get_db)):
    # Fetch question and associated session to get tech_stack
    result = await db.execute(
        select(Question).where(Question.id == question_id)
    )
    question = result.scalars().first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # We need the session to get the tech_stack
    # Since we didn't eager load, we fetch it now
    result_s = await db.execute(select(InterviewSession).where(InterviewSession.id == question.session_id))
    session = result_s.scalars().first()
    if not session:
         raise HTTPException(status_code=404, detail="Session not found for this question")

    evaluation = await interview_service.evaluate_answer(
        question.question_text, 
        answer_data.user_answer,
        session.tech_stack
    )

    new_answer = Answer(
        question_id=question_id,
        user_answer=answer_data.user_answer,
        feedback_json=evaluation,
        score_correctness=evaluation['score_correctness'],
        score_efficiency=evaluation['score_efficiency'],
        score_clarity=evaluation['score_clarity'],
        overall_assessment=evaluation['overall_assessment']
    )
    db.add(new_answer)
    await db.commit()
    await db.refresh(new_answer)
    
    return new_answer
