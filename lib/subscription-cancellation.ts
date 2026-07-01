import { TRIAL_DAYS } from "@/lib/pricing";

const SAST = "Africa/Johannesburg";

export type SubscriptionForCancellation = {
  status: string;
  trialEndsAt: Date | null;
  createdAt: Date;
};

export type CancellationTerms = {
  accessEndsAt: Date;
  isTrial: boolean;
  label: string;
  summary: string;
  billingNote: string;
};

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function sastDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SAST,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((p) => p.type === "year")!.value),
    month: Number(parts.find((p) => p.type === "month")!.value),
    day: Number(parts.find((p) => p.type === "day")!.value),
  };
}

/** Last moment of the current calendar month in South African time. */
export function endOfCurrentCalendarMonthSast(from: Date = new Date()): Date {
  const { year, month } = sastDateParts(from);
  const lastDay = new Date(year, month, 0).getDate();
  return new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T23:59:59+02:00`
  );
}

export function formatCancellationDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SAST,
  });
}

export function getCancellationStatusLabel(subscription: {
  status: string;
  trialEndsAt: Date | null;
  accessEndsAt: Date | null;
}): string {
  if (subscription.status !== "cancel_pending") {
    return subscription.status;
  }
  if (subscription.trialEndsAt && subscription.accessEndsAt) {
    const ms = Math.abs(subscription.accessEndsAt.getTime() - subscription.trialEndsAt.getTime());
    if (ms < 86_400_000) return "Cancelling (trial)";
  }
  return "Cancelling (until month end)";
}

export function getCancellationTerms(subscription: SubscriptionForCancellation): CancellationTerms {
  if (subscription.status === "trial") {
    const accessEndsAt =
      subscription.trialEndsAt ?? addDays(subscription.createdAt, TRIAL_DAYS);
    const endLabel = formatCancellationDate(accessEndsAt);

    return {
      accessEndsAt,
      isTrial: true,
      label: "Cancelling (trial)",
      summary: `You are still in your free trial. If you cancel today, stories continue until **${endLabel}** — when your trial ends.`,
      billingNote: "You will not be charged. PayFast billing is cancelled so nothing is taken after your trial.",
    };
  }

  const accessEndsAt = endOfCurrentCalendarMonthSast();
  const endLabel = formatCancellationDate(accessEndsAt);

  return {
    accessEndsAt,
    isTrial: false,
    label: "Cancelling (until month end)",
    summary: `If you cancel today, your stories will continue until the **end of this month** — **${endLabel}**.`,
    billingNote:
      "You will not be charged after that date. PayFast billing is cancelled so no further payments are taken.",
  };
}
