# AI Interviewer

An interactive web app that generates unique interview questions, evaluates user answers with AI, and provides detailed feedback—all in real time.

## Features

- **Dynamic Question Generation:** AI creates new, non-generic Excel interview questions at three difficulty levels (Easy, Medium, Hard).
- **Automated Evaluation:** User answers are scored for correctness, efficiency, and clarity using a rubric-based AI evaluator.
- **Quality Assurance:** Each question is validated for clarity, relevance, and uniqueness before being presented.
- **Detailed Feedback:** Users receive constructive, mini-lesson feedback and an overall assessment for each answer.
- **Session Tracking:** Interview progress and logs are maintained in the session.

## Tech Stack

- [Streamlit](https://streamlit.io/) for the web interface
- [LangChain](https://python.langchain.com/) for prompt orchestration
- [Google Gemini API](https://ai.google.dev/) (via `langchain-google-genai`) for LLM-powered question generation and evaluation
- [Pydantic](https://docs.pydantic.dev/) for structured output parsing
- [python-dotenv](https://pypi.org/project/python-dotenv/) for environment variable management

## Setup Instructions

1. **Clone the repository:**
   ```sh
   git clone https://github.com/sahniaditya007/ai-excel-interviewer.git
   cd ai-excel-interviewer
   ```
2. **Create and activate a virtual environment:**
   ```sh
   python -m venv myenv
   # On Windows PowerShell:
   .\myenv\Scripts\Activate.ps1
   ```
3. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```
4. **Set up environment variables:**
   - Create a `.env` file in the project root with your Google Gemini API key:
     ```env
     GEMINI_API_KEY=your_google_gemini_api_key_here
     ```
5. **Run the app:**
   ```sh
   streamlit run app.py
   ```

## Usage

- Use the sidebar to select a difficulty and start a new interview.
- Answer the generated Excel question in detail.
- Submit your answer to receive instant AI-powered evaluation and feedback.
- Repeat for more questions or different difficulty levels.

## File Structure

- `app.py` — Main Streamlit app
- `core/chain.py` — Chains for question generation, validation, and evaluation
- `core/prompts.py` — Prompt templates for LLMs
- `core/parsers.py` — Pydantic models for structured outputs

## Requirements

See `requirements.txt` for all dependencies.

## License

MIT License
