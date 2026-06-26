"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing or invalid. Please request a new one.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <h1 className="font-display text-3xl text-navy mb-4">Invalid reset link</h1>
        <p className="text-navy/70 mb-6">This link is missing or incomplete.</p>
        <Link href="/forgot-password" className="text-gold underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <h1 className="font-display text-3xl text-navy text-center mb-8">Choose a new password</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-navy/5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-navy/20 rounded-xl px-4 py-3"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-navy/20 rounded-xl px-4 py-3"
            minLength={8}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-cream py-3 rounded-full font-medium disabled:opacity-40"
        >
          {loading ? "Saving..." : "Update password"}
        </button>
      </form>
      <p className="text-center text-sm text-navy/60 mt-6">
        <Link href="/forgot-password" className="text-gold underline">
          Request a new link
        </Link>
      </p>
    </div>
  );
}
