import { Link, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/eduassist-logo.jpeg";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

export function Header() {
  const { session, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 w-full glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="EDUassist AI logo" className="h-10 w-10 rounded-xl object-cover shadow-soft" />
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            EDUassist <span className="text-gradient">AI</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" hash="features" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Features</Link>
          <Link to="/" hash="subjects" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Subjects</Link>
          <Link to="/quiz" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Quiz</Link>
          <Link to="/flashcards" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Flashcards</Link>
          {role === "admin" && <Link to="/admin" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Admin</Link>}
          {role === "parent" && <Link to="/parent" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">My child</Link>}
          {role === "parent" && <Link to="/parent-chat" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Help desk</Link>}
          {role === "parent" && <Link to="/parent-dashboard" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Analytics</Link>}
          <Link to="/planner" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Planner</Link>
          {(role === "student" || !role) && <Link to="/dashboard" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Dashboard</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-background text-foreground transition hover:bg-accent"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        {session ? (
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95"
          >
            Sign in
          </Link>
        )}
        </div>
      </div>
    </header>
  );
}