import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import PromptTemplate
from .schemas import EvaluationResponse
from core.prompts import evaluation_prompt, generation_prompt, validation_prompt
from core.parsers import InterviewEvaluation, GeneratedQuestion, QuestionValidationResult

load_dotenv()

# Initialize LLM
llm = ChatGoogleGenerativeAI(
    model="models/gemini-2.0-flash",
    google_api_key=os.environ.get("GOOGLE_API_KEY"),
    temperature=0.7,
    max_output_tokens=2048
)

class InterviewService:
    def __init__(self):
        self.generation_chain = self._create_generation_chain()
        self.validation_chain = self._create_validation_chain()
        self.evaluation_chain = self._create_evaluation_chain()

    def _create_generation_chain(self):
        parser = JsonOutputParser(pydantic_object=GeneratedQuestion)
        prompt = generation_prompt.partial(format_instructions=parser.get_format_instructions())
        return prompt | llm | parser

    def _create_validation_chain(self):
        parser = JsonOutputParser(pydantic_object=QuestionValidationResult)
        prompt = validation_prompt.partial(format_instructions=parser.get_format_instructions())
        return prompt | llm | parser

    def _create_evaluation_chain(self):
        parser = JsonOutputParser(pydantic_object=InterviewEvaluation)
        prompt = evaluation_prompt.partial(format_instructions=parser.get_format_instructions())
        return prompt | llm | parser

    async def generate_question(self, difficulty: str, tech_stack: str):
        MAX_ATTEMPTS = 3
        for _ in range(MAX_ATTEMPTS):
            try:
                generated = await self.generation_chain.ainvoke({
                    "difficulty": difficulty,
                    "tech_stack": tech_stack
                })
                validation = await self.validation_chain.ainvoke({
                    "question_text": generated['question_text'],
                    "tech_stack": tech_stack
                })
                
                if validation['is_valid']:
                    return generated
            except Exception as e:
                print(f"Error generating question: {e}")
                continue
        raise Exception("Failed to generate a valid question")

    async def evaluate_answer(self, question_text: str, user_answer: str, tech_stack: str):
        return await self.evaluation_chain.ainvoke({
            "question": question_text,
            "answer": user_answer,
            "tech_stack": tech_stack
        })

interview_service = InterviewService()
