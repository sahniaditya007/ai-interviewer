"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Terminal, Zap, Loader2 } from "lucide-react";
import { createSession } from "@/api";

const TECH_STACKS = [
  { name: "Python", description: "Backend, scripting, and data workflows." },
  { name: "JavaScript", description: "Frontend, Node.js, and async patterns." },
  { name: "React", description: "SPA patterns, hooks, and component design." },
  { name: "DevOps", description: "CI/CD, containers, infra-as-code, SRE." },
  { name: "SQL", description: "Queries, modeling, and performance tuning." },
  { name: "System Design", description: "Scalable architectures and trade-offs." },
  { name: "DSA", description: "Algorithms, data structures, and complexity." },
  { name: "Cloud", description: "AWS, GCP, Azure, and cloud-native patterns." },
];

export default function Home() {
  const router = useRouter();
  const [startingStack, setStartingStack] = useState<string | null>(null);

  const handleStartWithStack = async (stack: string) => {
    try {
      setStartingStack(stack);
      const session = await createSession("Medium", stack);
      router.push(`/interview/${session.id}`);
    } catch (error) {
      console.error("Failed to start interview session", error);
      setStartingStack(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />

      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Terminal className="w-6 h-6 text-indigo-400" />
          <span>AI Interviewer</span>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
              Dashboard
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="premium">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Zap className="w-4 h-4" />
          <span>Powered by Google Gemini 2.0 Flash</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          Live, AI-Powered Technical <br />
          <span className="text-indigo-400">Interviews for Any Stack</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          Choose your tech stack, get real-time questions, speak your answers, and
          receive instant, structured feedback on correctness, efficiency, and clarity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
          <Link href="#stacks">
            <Button size="lg" variant="premium" className="h-14 px-8 text-lg gap-2">
              Start Practicing <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              View History
            </Button>
          </Link>
        </div>

        {/* Tech Stack Selection */}
        <section
          id="stacks"
          className="mt-20 max-w-5xl mx-auto text-left animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200"
        >
          <div className="flex items-center justify-between gap-4 mb-6 flex-col sm:flex-row">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-400 mb-2">
                STACKS
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-white">
                Pick a stack to launch a live mock interview.
              </h2>
              <p className="text-slate-400 mt-2 max-w-xl text-sm md:text-base">
                We'll create a new session, stream your camera and mic, and adapt question
                difficulty to your performance in real time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TECH_STACKS.map((stack) => {
              const isStarting = startingStack === stack.name;
              return (
                <button
                  key={stack.name}
                  onClick={() => handleStartWithStack(stack.name)}
                  disabled={!!startingStack && !isStarting}
                  className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-400/60 hover:bg-white/10 transition-all duration-300 backdrop-blur-md text-left p-4 flex flex-col justify-between min-h-[140px]"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-1">
                      Tech Stack
                    </p>
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-200">
                      {stack.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {stack.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900/40 border border-white/10 text-slate-200">
                      {isStarting ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Starting session...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3 h-3" />
                          Start now
                        </>
                      )}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {isStarting ? "Connecting" : "~10 min"}
                    </span>
                  </div>

                  {/* Glow */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-cyan-500/10 blur-3xl transition-opacity" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Feature Grid */}
        <div id="features" className="grid md:grid-cols-3 gap-8 mt-24 text-left">
          {[
            {
              title: "Dynamic Questions",
              description:
                "Never answer the same question twice. AI generates unique scenarios grounded in real-world work.",
              icon: <Terminal className="w-6 h-6 text-indigo-400" />,
            },
            {
              title: "Instant Feedback",
              description:
                "Get structured scoring plus narrative feedback so you know exactly what to improve next.",
              icon: <Zap className="w-6 h-6 text-purple-400" />,
            },
            {
              title: "Session History",
              description:
                "Review prior sessions, stacks, and scores to showcase consistent growth over time.",
              icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              <div className="mb-4 p-3 bg-white/5 rounded-lg w-fit">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
