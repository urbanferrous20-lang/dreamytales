import { Suspense } from "react";
import { SignupSuccessClient } from "./SignupSuccessClient";

type PageProps = {
  searchParams: Promise<{ ref?: string; email?: string }>;
};

/** PayFast return URL — activation runs client-side via /api/signup/complete (retries until ITN finishes). */
export default async function SignupSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = params.email?.trim() ?? "";

  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto py-20 px-4 text-center text-navy/70">
          Setting up your account…
        </div>
      }
    >
      <SignupSuccessClient initialEmail={email} />
    </Suspense>
  );
}
