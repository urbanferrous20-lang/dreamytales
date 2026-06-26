import { Suspense } from "react";
import { SignupSuccessClient } from "./SignupSuccessClient";

export default function SignupSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto py-20 px-4 text-center text-navy/70">
          Setting up your account…
        </div>
      }
    >
      <SignupSuccessClient />
    </Suspense>
  );
}
