import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CancelForm } from "@/components/CancelForm";

export default async function CancelPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.userId },
  });

  if (!subscription || subscription.status === "cancelled" || subscription.status === "cancel_pending") {
    redirect("/dashboard");
  }

  const accessEndsAt = new Date();
  accessEndsAt.setMonth(accessEndsAt.getMonth() + 1);

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <h1 className="font-display text-3xl text-navy mb-4">Cancel subscription</h1>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 text-sm text-navy/80">
        <p className="mb-2">
          <strong>1 month&apos;s notice applies.</strong> If you cancel today, your stories will continue until{" "}
          <strong>{accessEndsAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</strong>.
        </p>
        <p>You will not be charged after that date. Billing will be cancelled automatically.</p>
      </div>
      <CancelForm accessEndsAt={accessEndsAt.toISOString()} />
      <Link href="/dashboard" className="block text-center text-sm text-navy/50 mt-6 hover:text-navy">
        ← Back to dashboard
      </Link>
    </div>
  );
}
