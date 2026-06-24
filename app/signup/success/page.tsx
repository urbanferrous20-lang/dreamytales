import Link from "next/link";

export default function SignupSuccessPage() {
  return (
    <div className="max-w-lg mx-auto py-20 px-4 text-center">
      <span className="text-6xl block mb-6 animate-float">🌙</span>
      <h1 className="font-display text-3xl text-navy mb-4">Welcome to Dreamy Tales!</h1>
      <p className="text-navy/70 mb-8">
        Your subscription is being activated. Your first custom bedtime short story will arrive tonight at 6pm SA time.
      </p>
      <Link
        href="/dashboard"
        className="inline-block bg-navy text-cream px-8 py-3 rounded-full font-medium hover:bg-navy-light transition-colors"
      >
        Go to dashboard →
      </Link>
    </div>
  );
}
