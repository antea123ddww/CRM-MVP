"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Unable to reset password.");
        return;
      }
      setMessage(data.message);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Backend is not running or API URL is wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <p className="text-sm text-slate-500">
            Choose a new password with at least 8 characters.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              This password reset link is invalid.
            </p>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <Input type="password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoComplete="new-password" />
              <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required autoComplete="new-password" />
              {message && <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save New Password"}
              </Button>
            </form>
          )}
          <Link href="/login" className="block text-center text-sm text-slate-600">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
