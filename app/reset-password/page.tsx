import { Suspense } from "react";
import { ResetPasswordClient } from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-16 px-4 text-center text-navy/70">Loading…</div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
