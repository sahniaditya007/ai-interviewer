"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessions, createSession, Session } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Calendar, ArrowRight, Loader2, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [selectedStack, setSelectedStack] = useState("Python");
    const router = useRouter();

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await getSessions();
            setSessions(data);
        } catch (error) {
            console.error("Failed to load sessions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewSession = async () => {
        setCreating(true);
        try {
            const session = await createSession("Medium", selectedStack);
            router.push(`/interview/${session.id}`);
        } catch (error) {
            console.error("Failed to create session", error);
            setCreating(false);
        }
    };

    const techStacks = [
        "Python",
        "JavaScript",
        "React",
        "Node.js",
        "DevOps",
        "SQL",
        "System Design",
        "DSA",
        "Cloud",
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                        <LayoutDashboard className="w-6 h-6 text-indigo-600" />
                        <span>Dashboard</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <select
                            value={selectedStack}
                            onChange={(e) => setSelectedStack(e.target.value)}
                            className="px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {techStacks.map(stack => (
                                <option key={stack} value={stack}>{stack}</option>
                            ))}
                        </select>

                        <Button
                            onClick={handleNewSession}
                            disabled={creating}
                            variant="premium"
                            className="gap-2"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            New Interview
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Interview History</h1>
                    <p className="text-slate-500 mt-2">Track your progress and review past performance.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    </div>
                ) : sessions.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm"
                    >
                        <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Plus className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No interviews yet</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            Start your first AI-powered mock interview to begin improving your technical skills.
                        </p>
                        <Button onClick={handleNewSession} disabled={creating} variant="premium" size="lg">
                            Start Your First Interview
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sessions.map((session, index) => (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link href={`/interview/${session.id}`}>
                                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 bg-white hover:border-indigo-200 group">
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${session.difficulty === 'Hard' ? 'bg-red-50 text-red-700 border-red-100' :
                                                            session.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                                'bg-green-50 text-green-700 border-green-100'
                                                        }`}>
                                                        {session.difficulty}
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-100">
                                                        {session.tech_stack}
                                                    </span>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                            <CardTitle className="text-lg mt-3">Interview #{session.id}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(session.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
