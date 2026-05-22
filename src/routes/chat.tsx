import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2, GraduationCap, BookOpen, Camera, Mic, MicOff, X, NotebookPen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Tutor — EduAssist.AI" },
      { name: "description", content: "Chat with your personal CBSE AI tutor. Get step-by-step explanations, notes, and practice questions adapted to your grade." },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string; image?: string };

const GRADES = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const SUBJECTS = [
  "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "Social Science", "History", "Geography", "Political Science", "Economics",
  "English", "Hindi", "Computer Science", "Accountancy", "Business Studies",
];

const SUGGESTIONS = [
  "Explain step-by-step",
  "Give me notes",
  "Create a worksheet",
  "Ask me questions",
  "Important formulas",
  "Revision tips",
];

function MarkdownView({ text }: { text: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-table:text-xs prose-th:border prose-th:border-border prose-th:bg-secondary prose-th:px-2 prose-th:py-1 prose-td:border prose-td:border-border prose-td:px-2 prose-td:py-1 prose-code:rounded prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-pre:bg-secondary">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {text || "…"}
      </ReactMarkdown>
    </div>
  );
}

function ChatPage() {
  const [grade, setGrade] = useState("10");
  const [subject, setSubject] = useState("Mathematics");
  const [homework, setHomework] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if ((!trimmed && !imageData) || loading) return;
    setError(null);
    const userMsg: Msg = { role: "user", content: trimmed || "(Please solve this from the image)", image: imageData ?? undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    const sentImage = imageData;
    setImageData(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, grade, subject, image: sentImage, homework }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reach the AI tutor.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
      setMessages(prev => prev.filter(m => m.content !== ""));
    } finally {
      setLoading(false);
    }
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 4 * 1024 * 1024) { setError("Image too large (max 4MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Voice input isn't supported in this browser. Try Chrome on desktop or Android.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setInput((prev) => (prev ? prev + " " : "") + txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-6">
        {/* Selector */}
        <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3 shadow-soft">
          <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <label className="text-xs font-medium text-muted-foreground">Class</label>
            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className="bg-transparent text-sm font-semibold focus:outline-none"
            >
              {GRADES.map(g => <option key={g} value={g}>Class {g}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="bg-transparent text-sm font-semibold focus:outline-none"
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setHomework(h => !h)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${homework ? "border-primary/50 bg-primary/10 text-primary" : "border-input bg-card text-muted-foreground hover:text-foreground"}`}
            title={homework ? "Homework mode is ON — bot will give hints, not full answers" : "Homework mode is OFF — full explanations"}
          >
            <NotebookPen className="h-3.5 w-3.5" />
            Homework mode {homework ? "ON" : "OFF"}
          </button>
          <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Tuned to NCERT · CBSE
          </span>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-3xl border border-border bg-card p-4 shadow-soft md:p-6"
          style={{ minHeight: "55vh", maxHeight: "65vh" }}
        >
          {messages.length === 0 && (
            <EmptyState onPick={s => send(`${s} on today's topic in ${subject} for Class ${grade}.`)} />
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="mr-2 mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground sm:flex">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-3 text-sm"
                    : "max-w-[88%] rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-3 text-sm leading-relaxed"
                }
              >
                {m.image && (
                  <img src={m.image} alt="Uploaded homework" className="mb-2 max-h-60 rounded-lg" />
                )}
                {m.role === "assistant" ? <MarkdownView text={m.content} /> : <span>{m.content}</span>}
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Tutor is thinking…
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => send(`${s} for Class ${grade} ${subject}.`)}
              disabled={loading}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        {imageData && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2">
            <img src={imageData} alt="preview" className="h-12 w-12 rounded-md object-cover" />
            <span className="text-xs text-muted-foreground">Image attached — your tutor will analyze it.</span>
            <button onClick={() => setImageData(null)} className="ml-auto rounded-full p-1 hover:bg-background" aria-label="Remove image">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <form
          onSubmit={e => { e.preventDefault(); send(input); }}
          className="mt-3 flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft focus-within:border-primary/50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-input bg-background text-muted-foreground transition hover:text-foreground"
            aria-label="Upload homework photo"
            title="Upload homework photo"
          >
            <Camera className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleMic}
            disabled={loading}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-input transition ${listening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-background text-muted-foreground hover:text-foreground"}`}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            title="Voice input"
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={`Ask anything about Class ${grade} ${subject}…`}
            rows={1}
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || (!input.trim() && !imageData)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-soft transition disabled:opacity-50"
            aria-label="Send"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          EduAssist.AI may make mistakes. Always double-check important answers with your teacher or textbook.
        </p>
      </main>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  const examples = [
    "Explain Newton's second law with an example",
    "Give me 5 MCQs on Quadratic Equations",
    "Summarize the chapter on Nationalism in India",
    "Help me write an essay on My Favourite Book",
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-elegant">
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </div>
      <h2 className="mt-5 text-2xl font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
        Hi! I'm your <span className="text-gradient">EduAssist.AI</span> tutor
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ask me anything from your CBSE syllabus — I'll explain it step-by-step at your level.
      </p>
      <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {examples.map(ex => (
          <button
            key={ex}
            onClick={() => onPick(ex)}
            className="rounded-2xl border border-border bg-card p-4 text-left text-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}