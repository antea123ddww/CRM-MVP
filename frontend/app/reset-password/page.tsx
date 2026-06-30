"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function resetPassword() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await res.json();
      setMessage(data.message || "Password reset request completed");
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
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <p className="text-sm text-slate-500">
            Use your reset token and choose a new password.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="Reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Input
            placeholder="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {message && <p className="text-sm text-slate-600">{message}</p>}

          <Button className="w-full" onClick={resetPassword} disabled={loading}>
            {loading ? "Saving..." : "Save New Password"}
          </Button>

          <Link href="/login" className="block text-center text-sm text-slate-600">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
