"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setSent(true);
      setMessage(data.message ?? "Check your email for a reset link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <h1 className="font-display text-3xl text-navy text-center mb-3">Reset your password</h1>
      <p className="text-center text-navy/60 text-sm mb-8">
        Enter the email you used when you signed up. We&apos;ll send a reset link if an account exists.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>
      )}
      {message && (
        <div className="bg-mint/20 border border-mint/40 text-navy rounded-xl p-4 mb-6 text-sm space-y-2">
          <p>{message}</p>
          <p className="text-navy/60 text-xs">
            Check spam/junk. If nothing arrives, your account may not be set up yet — try{" "}
            <Link href="/signup/success" className="underline">
              finishing signup
            </Link>{" "}
            or email Admin@dreamytales.co.za.
          </p>
        </div>
      )}

      {!sent ? (
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-cream py-3 rounded-full font-medium disabled:opacity-40"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      ) : null}

      <p className="text-center text-sm text-navy/60 mt-6">
        <Link href="/login" className="text-gold underline">
          Back to sign in
        </Link>
      </p>
      <p className="text-center text-xs text-navy/50 mt-4">
        Just finished PayFast checkout? Try{" "}
        <Link href="/signup/success" className="underline">
          completing signup
        </Link>{" "}
        or sign in with the password you chose at signup.
      </p>
    </div>
  );
}
