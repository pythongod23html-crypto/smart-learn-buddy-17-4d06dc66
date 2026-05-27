import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Play, Pause, RotateCcw, Zap, Coffee, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Phase = "idle" | "focus" | "break";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

type Ctx = {
  phase: Phase;
  seconds: number;
  running: boolean;
  onBreak: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipBreak: () => void;
};

const FocusCtx = createContext<Ctx | null>(null);

export function useFocusMode() {
  const ctx = useContext(FocusCtx);
  if (!ctx) throw new Error("useFocusMode must be used within FocusModeProvider");
  return ctx;
}

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s > 1) return s - 1;
        // hit zero → swap phase
        setPhase((p) => {
          const next: Phase = p === "focus" ? "break" : "focus";
          setSeconds(next === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
          if (next === "focus") setRunning(false); // pause after break ends
          return next;
        });
        return 0;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const start = () => {
    if (phase === "idle") {
      setPhase("focus");
      setSeconds(FOCUS_SECONDS);
    }
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setPhase("idle");
    setSeconds(FOCUS_SECONDS);
  };
  const skipBreak = () => {
    setPhase("idle");
    setSeconds(FOCUS_SECONDS);
    setRunning(false);
  };

  return (
    <FocusCtx.Provider
      value={{ phase, seconds, running, onBreak: phase === "break", start, pause, reset, skipBreak }}
    >
      {children}
      <BreakOverlay />
    </FocusCtx.Provider>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function FocusTimerWidget({ className = "" }: { className?: string }) {
  const { phase, seconds, running, start, pause, reset } = useFocusMode();
  const active = phase !== "idle";
  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 shadow-soft backdrop-blur ${className}`}
      aria-label="Focus mode timer"
    >
      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${active ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
        <Zap className="h-3.5 w-3.5" />
      </div>
      <span className="font-mono text-sm font-bold tabular-nums">{fmt(seconds)}</span>
      {!running ? (
        <button
          onClick={start}
          aria-label="Start focus session"
          className="grid h-6 w-6 place-items-center rounded-full text-foreground transition hover:bg-accent"
        >
          <Play className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          onClick={pause}
          aria-label="Pause focus session"
          className="grid h-6 w-6 place-items-center rounded-full text-foreground transition hover:bg-accent"
        >
          <Pause className="h-3.5 w-3.5" />
        </button>
      )}
      {active && (
        <button
          onClick={reset}
          aria-label="Reset timer"
          className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function BreakOverlay() {
  const { onBreak, seconds, skipBreak } = useFocusMode();
  return (
    <AnimatePresence>
      {onBreak && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.92, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative mx-4 max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white/40 p-10 text-center shadow-elegant backdrop-blur-2xl dark:border-white/10 dark:bg-white/5"
          >
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-elegant"
              >
                <Coffee className="h-8 w-8" />
              </motion.div>
              <h2
                className="mt-6 text-2xl font-bold text-foreground"
                style={{ fontFamily: "Sora, Inter, sans-serif" }}
              >
                Great session! Time to stretch and rest your eyes.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Spark has paused your chat. Look at something 20 feet away and breathe.
              </p>
              <p
                className="mt-8 font-mono text-6xl font-extrabold text-gradient tabular-nums"
                style={{ fontFamily: "Sora, Inter, sans-serif" }}
              >
                {fmt(seconds)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                Break remaining
              </p>
              <button
                onClick={skipBreak}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-5 py-2 text-xs font-semibold text-foreground transition hover:bg-accent"
              >
                <Sparkles className="h-3.5 w-3.5" /> Skip break
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
