import { Link, useNavigate } from "@tanstack/react-router";
import logo from "@/assets/eduassist-logo.jpeg";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

export function Header() {
  const { session, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  // Hide top bar entirely for logged-in users — the sidebar is the nav.
  if (session) return null;
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full glass">

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="EduAssist.AI logo" className="h-7 w-7 rounded-lg object-cover shadow-soft" />
          <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            EduAssist<span className="text-gradient">.AI</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-5 md:flex">
          <Link to="/" hash="features" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Features</Link>
          <Link to="/" hash="subjects" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Subjects</Link>
          <Link to="/quiz" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Quiz</Link>
          {role === "admin" && <Link to="/admin" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Admin</Link>}
          {role === "parent" && <Link to="/parent" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">My child</Link>}
          {role === "parent" && <Link to="/parent-chat" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Help</Link>}
          {role === "parent" && <Link to="/parent-dashboard" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Analytics</Link>}
          {(role === "student" || !role) && <Link to="/dashboard" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Dashboard</Link>}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-input bg-background text-foreground transition hover:bg-accent"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        {session ? (
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-4 py-1.5 text-xs font-semibold text-foreground transition hover:bg-accent"
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95"
          >
            Sign in
          </Link>
        )}
        </div>
      </div>
      </header>
      <div aria-hidden className="h-14" />
    </>
  );
}