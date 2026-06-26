import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, isSecureRequest, setSessionCookie } from "@/lib/auth";
import { findEmailForSignupId, resolveUserAfterPayment } from "@/lib/signup-complete";
import { SignupSuccessClient } from "./SignupSuccessClient";

type PageProps = {
  searchParams: Promise<{ ref?: string; email?: string }>;
};

export default async function SignupSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const signupId = params.ref?.trim();
  let email = params.email?.trim().toLowerCase();

  if (signupId || email) {
    if (signupId && !email) {
      email = (await findEmailForSignupId(signupId)) ?? undefined;
    }

    const user = await resolveUserAfterPayment({ signupId, email });

    if (user) {
      const headerStore = await headers();
      const secure =
        headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https" ||
        process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ||
        process.env.NODE_ENV === "production";

      const token = await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
      await setSessionCookie(token, { secure });
      redirect("/dashboard");
    }
  }

  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto py-20 px-4 text-center text-navy/70">
          Setting up your account…
        </div>
      }
    >
      <SignupSuccessClient initialEmail={email ?? params.email ?? ""} />
    </Suspense>
  );
}
