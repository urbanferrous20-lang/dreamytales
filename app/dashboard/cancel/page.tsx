import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CancelForm } from "@/components/CancelForm";
import { getCancellationTerms } from "@/lib/subscription-cancellation";

function renderSummary(summary: string) {
  const parts = summary.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i}>{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default async function CancelPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.userId },
  });

  if (!subscription || subscription.status === "cancelled" || subscription.status === "cancel_pending") {
    redirect("/dashboard");
  }

  const terms = getCancellationTerms(subscription);

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <h1 className="font-display text-3xl text-navy mb-4">Cancel subscription</h1>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-sm text-navy/80">
        <p className="mb-2">{renderSummary(terms.summary)}</p>
        <p>{terms.billingNote}</p>
      </div>
      <CancelForm accessEndsAt={terms.accessEndsAt.toISOString()} />
      <Link href="/dashboard" className="block text-center text-sm text-navy/50 mt-6 hover:text-navy">
        ← Back to dashboard
      </Link>
    </div>
  );
}
