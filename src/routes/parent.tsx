import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/parent")({ component: ParentPage });

function ParentPage() {
  const { session, loading, role, student } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading || !session) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;

  if (role !== "parent") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Parent dashboard</CardTitle>
              <CardDescription>This area is for parent accounts only.</CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const feeBadge = student
    ? student.fee_status === "paid"
      ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
      : student.fee_status === "due"
        ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
        : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
    : "";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, parent</h1>
          <p className="text-sm text-muted-foreground">Track your child's learning and fee status.</p>
        </div>

        {!student ? (
          <Card>
            <CardHeader>
              <CardTitle>No linked student</CardTitle>
              <CardDescription>Please contact your school admin.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{student.student_name}</CardTitle>
                <CardDescription>
                  Code: <span className="font-mono">{student.student_code}</span>
                  {student.class_grade ? ` · ${student.class_grade}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">Your child uses EDUassist AI to ask doubts on school topics, take quizzes, and review flashcards.</p>
                <Link to="/chat" className="inline-flex text-sm font-medium text-primary hover:underline">
                  See what your child is studying →
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fee status</CardTitle>
                <CardDescription>Current term</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount due</span>
                  <span className="text-2xl font-bold">₹{student.fee_amount_due}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={feeBadge}>{student.fee_status}</span>
                </div>
                {student.fee_notes && (
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <p className="font-medium">Note from school</p>
                    <p className="mt-1 text-muted-foreground">{student.fee_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}