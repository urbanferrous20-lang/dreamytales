"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function SignupSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("Setting up your account…");

  useEffect(() => {
    async function finishSignup() {
      const signupId =
        searchParams.get("ref") ??
        sessionStorage.getItem("dreamytales_signup_ref") ??
        undefined;
      const email = sessionStorage.getItem("dreamytales_signup_email") ?? undefined;

      if (!email) {
        setStatus("ready");
        setMessage(
          "Your payment was successful. Sign in with the email and password you chose during signup."
        );
        return;
      }

      try {
        const res = await fetch("/api/signup/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signupId, email }),
        });
        const data = await res.json();

        if (res.ok) {
          sessionStorage.removeItem("dreamytales_signup_ref");
          sessionStorage.removeItem("dreamytales_signup_email");
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        setStatus("ready");
        setMessage(
          data.error ??
            "Your payment went through. Sign in with the email and password you used at signup."
        );
      } catch {
        setStatus("ready");
        setMessage(
          "Your payment was successful. Sign in with the email and password you chose during signup."
        );
      }
    }

    void finishSignup();
  }, [router, searchParams]);

  return (
    <div className="max-w-lg mx-auto py-20 px-4 text-center">
      <span className="text-6xl block mb-6 animate-float">🌙</span>
      <h1 className="font-display text-3xl text-navy mb-4">Welcome to Dreamy Tales!</h1>
      <p className="text-navy/70 mb-8">{message}</p>
      {status === "loading" ? (
        <p className="text-sm text-navy/50">Please wait…</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-block bg-navy text-cream px-8 py-3 rounded-full font-medium hover:bg-navy-light transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-block border border-navy/20 text-navy px-8 py-3 rounded-full font-medium hover:bg-navy/5 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
