"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReset() {
    setLoading(true);
    setMessage("");
    setResetToken("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to create reset token");
        return;
      }

      setMessage(data.message);
      setResetToken(data.resetToken);
    } catch {
      setMessage("Backend is not running or API URL is wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <p className="text-sm text-slate-500">
            Enter your email to create a password reset token.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {message && <p className="text-sm text-slate-600">{message}</p>}

          {resetToken && (
            <div className="rounded-md border p-3 text-sm">
              <p className="font-semibold">Reset token</p>
              <p className="break-all text-slate-600">{resetToken}</p>
              <Link
                href={`/reset-password?token=${resetToken}`}
                className="mt-2 inline-block font-medium text-slate-950"
              >
                Continue to reset form
              </Link>
            </div>
          )}

          <Button className="w-full" onClick={requestReset} disabled={loading}>
            {loading ? "Creating token..." : "Create Reset Token"}
          </Button>

          <Link href="/login" className="block text-center text-sm text-slate-600">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
