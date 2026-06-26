"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <h1 className="font-display text-3xl text-navy text-center mb-8">Welcome back</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-navy/5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-navy/20 rounded-xl px-4 py-3"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-navy">Password</label>
            <Link href="/forgot-password" className="text-xs text-gold underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-navy/20 rounded-xl px-4 py-3"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-cream py-3 rounded-full font-medium disabled:opacity-40"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-navy/60 mt-6">
        No account?{" "}
        <Link href="/signup" className="text-gold underline">
          Start free trial
        </Link>
      </p>
      <p className="text-center text-xs text-navy/50 mt-4">
        Just paid via PayFast?{" "}
        <Link href="/signup/success" className="underline">
          Finish account setup
        </Link>
      </p>
    </div>
  );
}
