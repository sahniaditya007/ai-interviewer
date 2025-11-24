import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Session {
    id: number;
    created_at: string;
    difficulty: string;
    tech_stack: string;
    questions: Question[];
}

export interface Question {
    id: number;
    question_text: string;
    difficulty: string;
}

export interface AnswerResponse {
    id: number;
    user_answer: string;
    feedback_json: {
        score_correctness: number;
        score_efficiency: number;
        score_clarity: number;
        feedback: string;
        overall_assessment: string;
    };
}

export const createSession = async (difficulty: string, tech_stack: string) => {
    const response = await api.post<Session>('/sessions', { difficulty, tech_stack });
    return response.data;
};

export const getSession = async (sessionId: number) => {
    const response = await api.get<Session>(`/sessions/${sessionId}`);
    return response.data;
};

export const getSessions = async () => {
    const response = await api.get<Session[]>('/sessions');
    return response.data;
};

export const generateQuestion = async (sessionId: number, difficulty?: "Easy" | "Medium" | "Hard") => {
    if (difficulty) {
        const response = await api.post<Question>(
            `/sessions/${sessionId}/questions`,
            null,
            { params: { difficulty } }
        );
        return response.data;
    }

    const response = await api.post<Question>(`/sessions/${sessionId}/questions`);
    return response.data;
};

export const submitAnswer = async (questionId: number, userAnswer: string) => {
    const response = await api.post<AnswerResponse>(`/questions/${questionId}/answer`, {
        question_id: questionId,
        user_answer: userAnswer,
    });
    return response.data;
};

export default api;
