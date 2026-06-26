"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const COMPLETE_ATTEMPTS = 8;
const COMPLETE_RETRY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function SignupSuccessClient({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [message, setMessage] = useState("Setting up your account…");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    async function finishSignup() {
      const signupId =
        searchParams.get("ref") ??
        sessionStorage.getItem("dreamytales_signup_ref") ??
        undefined;
      const resolvedEmail =
        searchParams.get("email") ??
        sessionStorage.getItem("dreamytales_signup_email") ??
        (initialEmail || undefined);
      const storedPassword = sessionStorage.getItem("dreamytales_signup_password") ?? undefined;

      if (resolvedEmail && !email) {
        setEmail(resolvedEmail);
      }

      if (!signupId && !resolvedEmail) {
        setStatus("ready");
        setMessage("Your payment was successful. Sign in with the email and password you chose during signup.");
        return;
      }

      try {
        for (let attempt = 0; attempt < COMPLETE_ATTEMPTS; attempt += 1) {
          const res = await fetch("/api/signup/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              signupId,
              email: resolvedEmail,
              password: storedPassword,
            }),
          });
          const data = await res.json();

          if (res.ok) {
            sessionStorage.removeItem("dreamytales_signup_ref");
            sessionStorage.removeItem("dreamytales_signup_email");
            sessionStorage.removeItem("dreamytales_signup_password");
            router.replace("/dashboard");
            router.refresh();
            return;
          }

          if (res.status === 404 && attempt < COMPLETE_ATTEMPTS - 1) {
            setMessage("Confirming your payment with PayFast…");
            await sleep(COMPLETE_RETRY_MS);
            continue;
          }

          setStatus("ready");
          setMessage(
            data.error ??
              "Your payment went through. Enter your signup email and password below to finish."
          );
          return;
        }
      } catch {
        setStatus("ready");
        setMessage("Your payment was successful. Enter your signup email and password below to finish.");
      }
    }

    void finishSignup();
  }, [router, searchParams, initialEmail]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    const signupId =
      searchParams.get("ref") ??
      sessionStorage.getItem("dreamytales_signup_ref") ??
      undefined;

    try {
      const completeRes = await fetch("/api/signup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ signupId, email: email.trim().toLowerCase(), password }),
      });

      if (completeRes.ok) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.error ?? "Sign in failed");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto py-20 px-4 text-center">
      <span className="text-6xl block mb-6 animate-float">🌙</span>
      <h1 className="font-display text-3xl text-navy mb-4">Welcome to Dreamy Tales!</h1>
      <p className="text-navy/70 mb-8">{message}</p>

      {status === "loading" ? (
        <p className="text-sm text-navy/50">Please wait…</p>
      ) : (
        <div className="text-left bg-white rounded-2xl p-6 shadow-sm border border-navy/5 mb-6">
          <h2 className="font-medium text-navy mb-4 text-center">Finish signing in</h2>
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
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
              <label className="block text-sm font-medium text-navy mb-1">Password</label>
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
              disabled={loginLoading}
              className="w-full bg-navy text-cream py-3 rounded-full font-medium disabled:opacity-40"
            >
              {loginLoading ? "Signing in…" : "Continue to dashboard"}
            </button>
          </form>
        </div>
      )}

      <Link href="/forgot-password" className="text-sm text-gold underline">
        Forgot password?
      </Link>
    </div>
  );
}
