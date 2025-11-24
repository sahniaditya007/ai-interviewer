
# AI Interviewer

AI Interviewer is a web application that conducts technical interviews using a conversational AI. It leverages Google's Gemini models to generate questions, evaluate answers, and provide feedback in real-time.

## Features

- **Dynamic Question Generation**: The AI generates unique, real-world-based questions for various technical stacks.
- **Real-time Evaluation**: Get instant feedback on your answers, with scores for correctness, efficiency, and clarity.
- **Session History**: Track your progress and review past interviews to identify areas for improvement.
- **Multiple Tech Stacks**: Practice for interviews in various domains, including Python, JavaScript, React, DevOps, SQL, and more.
- **Voice-to-Text and Text-to-Speech**: Speak your answers and hear the AI's questions and feedback.

## Tech Stack

### Backend

- **Python**: The primary language for the backend.
- **FastAPI**: A modern, fast web framework for building APIs.
- **SQLAlchemy**: A SQL toolkit and Object-Relational Mapper (ORM).
- **LangChain**: A framework for developing applications powered by language models.
- **Google Gemini**: The language model used for question generation and evaluation.

### Frontend

- **Next.js**: A React framework for building server-side rendered and static web applications.
- **TypeScript**: A typed superset of JavaScript.
- **Tailwind CSS**: A utility-first CSS framework.
- **axios**: A promise-based HTTP client for the browser and Node.js.

## Project Structure

```
.
├── app.py                  # Streamlit application for a simpler demo
├── backend
│   ├── database.py         # Database connection and session management
│   ├── main.py             # FastAPI application entry point and API endpoints
│   ├── models.py           # SQLAlchemy ORM models
│   ├── schemas.py          # Pydantic schemas for API request and response validation
│   └── services.py         # Business logic for interviews, questions, and answers
├── core
│   ├── chain.py            # LangChain chains for question generation and evaluation
│   ├── parsers.py          # Output parsers for LangChain
│   └── prompts.py          # Prompts for the language model
├── frontend
│   ├── src
│   │   ├── api
│   │   │   └── index.ts      # API client for the frontend
│   │   ├── app
│   │   │   ├── page.tsx      # Landing page
│   │   │   ├── dashboard
│   │   │   │   └── page.tsx  # Dashboard page to view past interviews
│   │   │   └── interview
│   │   │       └── [id]
│   │   │           └── page.tsx  # Interview page
│   │   └── components      # React components
│   ├── package.json          # Frontend dependencies
│   └── next.config.ts        # Next.js configuration
├── Dockerfile.backend      # Dockerfile for the backend application
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Python 3.11 or later
- Node.js 18 or later
- An API key for Google Gemini

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/sahniaditya007/ai-interviewer.git
    cd ai-interviewer
    ```

2.  **Set up the backend:**

    -   Create a virtual environment:

        ```bash
        python -m venv venv
        source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
        ```

    -   Install the dependencies:

        ```bash
        pip install -r requirements.txt
        ```

    -   Create a `.env` file in the root directory and add your Google API key:

        ```
        GOOGLE_API_KEY="your-google-api-key"
        ```

3.  **Set up the frontend:**

    -   Navigate to the `frontend` directory:

        ```bash
        cd frontend
        ```

    -   Install the dependencies:

        ```bash
        npm install
        ```

### Running the Application

1.  **Start the backend:**

    -   Navigate to the root directory.
    -   Run the following command:

        ```bash
        uvicorn backend.main:app --reload
        ```

    The backend will be running at `http://localhost:8000`.

2.  **Start the frontend:**

    -   Navigate to the `frontend` directory.
    -   Run the following command:

        ```bash
        npm run dev
        ```

    The frontend will be running at `http://localhost:3000`.

3.  **Open your browser** and navigate to `http://localhost:3000`.

## API Endpoints

The backend provides the following REST API endpoints:

-   `POST /sessions`: Create a new interview session.
-   `GET /sessions/{session_id}`: Get details of a specific interview session.
-   `GET /sessions`: Get a list of all interview sessions.
-   `POST /sessions/{session_id}/questions`: Generate a new question for a session.
-   `POST /questions/{question_id}/answer`: Submit an answer to a question and get feedback.

## Database Schema

The application uses a SQLite database to store information about interview sessions, questions, and answers. The schema is defined in `backend/models.py` and consists of the following tables:

-   `interview_sessions`: Stores information about each interview session, including the tech stack and difficulty level.
-   `questions`: Stores the questions generated by the AI for each session.
-   `answers`: Stores the user's answers and the AI's feedback.

## Future Improvements

-   **Support for more tech stacks**: Add support for more programming languages, frameworks, and technical domains.
-   **Code execution**: Allow users to write and execute code in the browser.
-   **Multi-user support**: Allow multiple users to have their own accounts and interview history.
-   **Improved feedback**: Provide more detailed and actionable feedback on user answers.
-   **More realistic interview scenarios**: Simulate different types of interviews, such as behavioral interviews and system design interviews with a whiteboard.
