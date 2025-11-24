"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSession, generateQuestion, submitAnswer, Session, Question } from "@/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowRight, Mic, MicOff, ChevronLeft, BarChart2, CheckCircle2, AlertCircle, Video, Volume2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUESTION_DURATION_SECONDS = 180;

const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export default function InterviewPage() {
    const params = useParams();
    const sessionId = Number(params.id);

    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [feedback, setFeedback] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [difficultyMode, setDifficultyMode] = useState<"Adaptive" | "Easy" | "Medium" | "Hard">("Adaptive");

    // Audio/Video State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [recognition, setRecognition] = useState<any>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

    useEffect(() => {
        if (sessionId) loadSession();
        setupMedia();
        setupSpeechRecognition();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [sessionId]);

    const setupMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing media devices:", err);
        }
    };

    const setupSpeechRecognition = () => {
        if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;

            recognitionInstance.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                // Append final to existing transcript state (careful with state updates)
                if (finalTranscript) {
                    setTranscript(prev => prev + " " + finalTranscript);
                }
            };

            recognitionInstance.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };

            setRecognition(recognitionInstance);
        } else {
            console.warn("Speech recognition not supported");
        }
    };

    const speakText = (text: string) => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel(); // Stop previous
            const utterance = new SpeechSynthesisUtterance(text);

            // Try to pick a more natural-sounding English voice when available.
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v => v.lang?.toLowerCase().startsWith("en-") && v.name.toLowerCase().includes("natural"))
                || voices.find(v => v.lang?.toLowerCase().startsWith("en-"));
            if (preferred) {
                utterance.voice = preferred;
            }

            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.95;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const loadSession = async () => {
        try {
            const data = await getSession(sessionId);
            setSession(data);
            if (data.questions && data.questions.length > 0) {
                const lastQ = data.questions[data.questions.length - 1];
                setCurrentQuestion(lastQ);
                setTimeLeft(QUESTION_DURATION_SECONDS);
                // Don't auto-speak on load to avoid annoyance, or maybe do?
                // speakText(lastQ.question_text); 
            }
        } catch (error) {
            console.error("Failed to load session", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateQuestion = async () => {
        setGenerating(true);
        setFeedback(null);
        setTranscript("");
        setAudioUrl(null);
        try {
            const difficultyParam = difficultyMode === "Adaptive" ? undefined : difficultyMode;
            const question = await generateQuestion(sessionId, difficultyParam);
            setCurrentQuestion(question);
            setTimeLeft(QUESTION_DURATION_SECONDS);
            setSession(prev => prev ? ({
                ...prev,
                questions: [...prev.questions, question]
            }) : null);

            // Speak the new question
            speakText(question.question_text);

        } catch (error) {
            console.error("Failed to generate question", error);
        } finally {
            setGenerating(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            recognition?.stop();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
        } else {
            setTranscript(""); // Clear previous transcript for new answer.
            setAudioUrl(null);

            if (mediaStreamRef.current) {
                const recorder = new MediaRecorder(mediaStreamRef.current);
                mediaRecorderRef.current = recorder;
                audioChunksRef.current = [];

                recorder.ondataavailable = (event: BlobEvent) => {
                    if (event.data && event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    const url = URL.createObjectURL(blob);
                    setAudioUrl(url);
                };

                recorder.start();
            }

            recognition?.start();
            setIsRecording(true);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!currentQuestion || !transcript.trim()) return;
        setSubmitting(true);
        if (isRecording) {
            recognition?.stop();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
        }

        try {
            const result = await submitAnswer(currentQuestion.id, transcript);
            setFeedback(result.feedback_json);
            speakText(result.feedback_json.overall_assessment + ". " + result.feedback_json.feedback);
        } catch (error) {
            console.error("Failed to submit answer", error);
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            if (isRecording) {
                recognition?.stop();
                setIsRecording(false);
            }
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, isRecording, recognition]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Header */}
            <header className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                        <span>Exit Interview</span>
                    </Link>
                    <div className="font-semibold text-white flex items-center gap-3">
                        <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm border border-indigo-500/30">
                            {session?.tech_stack}
                        </span>
                        <span className="text-slate-500">|</span>
                        <span>{session?.difficulty}</span>
                        {currentQuestion && (
                            <>
                                <span className="text-slate-500">|</span>
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-100">
                                    <Clock className="w-3 h-3" />
                                    {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                                </span>
                            </>
                        )}
                        <select
                            value={difficultyMode}
                            onChange={(e) => setDifficultyMode(e.target.value as any)}
                            className="ml-4 px-2 py-1 rounded-md bg-slate-900/60 border border-white/10 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="Adaptive">Adaptive</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-6 py-8 max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Video & Controls */}
                <div className="space-y-6">
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />

                        {/* Overlay Status */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            {isRecording && (
                                <div className="flex items-center gap-2 bg-red-500/90 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                    REC
                                </div>
                            )}
                            {isSpeaking && (
                                <div className="flex items-center gap-2 bg-indigo-500/90 text-white px-3 py-1 rounded-full text-xs font-bold">
                                    <Volume2 className="w-3 h-3" />
                                    AI SPEAKING
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
                        {!currentQuestion ? (
                            <Button
                                onClick={handleGenerateQuestion}
                                disabled={generating}
                                variant="premium"
                                size="lg"
                                className="w-full h-16 text-lg"
                            >
                                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Interview"}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={toggleRecording}
                                    variant={isRecording ? "destructive" : "secondary"}
                                    size="lg"
                                    className="h-16 w-16 rounded-full p-0 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                                >
                                    {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                </Button>

                                <Button
                                    onClick={handleSubmitAnswer}
                                    disabled={!transcript || submitting || isRecording}
                                    variant="premium"
                                    size="lg"
                                    className="h-16 px-8 text-lg flex-1"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Answer"}
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Transcript Preview */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 min-h-[100px] space-y-2">
                        <h4 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Live Transcript</h4>
                        <p className="text-slate-200">
                            {transcript || <span className="text-slate-600 italic">Listening...</span>}
                        </p>
                        <p className="text-xs text-slate-400">
                            {isRecording
                                ? wordCount < 25
                                    ? "Share your high-level approach and key ideas."
                                    : wordCount < 60
                                        ? "Go deeper into trade-offs, edge cases, and concrete examples."
                                        : "Wrap up with a concise summary of your solution."
                                : "Press the mic button to start answering out loud when you're ready."}
                        </p>
                    </div>

                    {audioUrl && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h4 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Recorded Audio</h4>
                            <audio controls src={audioUrl} className="w-full" />
                        </div>
                    )}
                </div>

                {/* Right Column: AI Interaction */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {currentQuestion && (
                            <motion.div
                                key={currentQuestion.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                {/* Question Card */}
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-sm">
                                    <h3 className="text-indigo-300 font-medium mb-2 text-sm uppercase tracking-wider">AI Interviewer</h3>
                                    <p className="text-xl md:text-2xl font-medium leading-relaxed">
                                        {currentQuestion.question_text}
                                    </p>
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => speakText(currentQuestion.question_text)}
                                            className="text-indigo-300 hover:text-white hover:bg-indigo-500/20"
                                        >
                                            <Volume2 className="w-4 h-4 mr-2" /> Replay Question
                                        </Button>
                                    </div>
                                </div>

                                {/* Feedback Area */}
                                {feedback && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                                    >
                                        <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                                            <h3 className="font-semibold text-lg">Evaluation</h3>
                                            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${feedback.overall_assessment === 'Excellent' || feedback.overall_assessment === 'Good'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                }`}>
                                                {feedback.overall_assessment === 'Excellent' || feedback.overall_assessment === 'Good' ? (
                                                    <CheckCircle2 className="w-4 h-4" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4" />
                                                )}
                                                {feedback.overall_assessment}
                                            </div>
                                        </div>

                                        <div className="p-6 grid grid-cols-3 gap-4 border-b border-white/10">
                                            {[
                                                { label: "Correctness", score: feedback.score_correctness },
                                                { label: "Efficiency", score: feedback.score_efficiency },
                                                { label: "Clarity", score: feedback.score_clarity }
                                            ].map((metric, i) => (
                                                <div key={i} className="text-center p-3 rounded-lg bg-white/5">
                                                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{metric.label}</div>
                                                    <div className={`text-xl font-bold ${metric.score >= 4 ? 'text-emerald-400' :
                                                            metric.score >= 3 ? 'text-amber-400' :
                                                                'text-rose-400'
                                                        }`}>
                                                        {metric.score}/5
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-6">
                                            <p className="text-slate-300 leading-relaxed text-sm">
                                                {feedback.feedback}
                                            </p>
                                            <div className="mt-6 flex justify-end">
                                                <Button
                                                    onClick={handleGenerateQuestion}
                                                    disabled={generating}
                                                    variant="premium"
                                                    className="gap-2"
                                                >
                                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                                    Next Question
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
