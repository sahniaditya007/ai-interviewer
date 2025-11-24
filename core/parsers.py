from pydantic import BaseModel, Field
from typing import Literal

class InterviewEvaluation(BaseModel):
    score_correctness: int = Field(
        description="The score from 0 to 5 for the technical correctness of the answer.",
        ge=0,
        le=5
    )
    score_efficiency: int = Field(
    description="The score from 0 to 5 for the efficiency of the proposed solution. For example, choosing appropriate algorithms, data structures, or stack-specific best practices.",
    ge=0,
    le=5
    )
    score_clarity: int = Field(
    description="The score from 0 to 5 for the clarity of the candidate's explanation.",
    ge=0,
    le=5
    )
    feedback: str = Field(
    description="Detailed, constructive feedback for the candidate. Explain why the scores were given. If the answer was incorrect, provide the correct answer or a better approach. This should be a mini-lesson."
    )
    overall_assessment: Literal["Excellent", "Good", "Average", "Needs Improvement"] = Field(
    description="A single, overall assessment of the candidate's answer."
    )

class GeneratedQuestion(BaseModel):
    question_text: str = Field(
        description="The full text of the generated interview question."
    )
    difficulty: Literal["Easy", "Medium", "Hard"] = Field(
        description="The assessed difficulty of the question."
    )

class QuestionValidationResult(BaseModel):
    is_valid: bool = Field(
        description="A boolean flag indicating if the question is valid (true) or not (false)."
    )
    reasoning: str = Field(
        description="A brief explanation for the validation decision. If not valid, explain why (e.g., 'too ambiguous', 'not relevant to the chosen tech stack')."
    )
