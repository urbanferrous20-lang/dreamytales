export const BASE_MONTHLY_ZAR = 99;
export const BASE_AUDIO_MONTHLY_ZAR = 149;
export const ADDON_CHILD_ZAR = 50;
export const TRIAL_DAYS = 7;
export const ANNUAL_MONTHS_CHARGED = 11;
export const ANNUAL_MONTHS_INCLUDED = 12;

export type BillingInterval = "monthly" | "annual";
export type StoryPlan = "pdf" | "pdf_audio";

export const STORY_PLANS: Record<
  StoryPlan,
  { label: string; shortLabel: string; description: string; features: string[] }
> = {
  pdf: {
    label: "Storybook PDF",
    shortLabel: "PDF only",
    description: "Illustrated bedtime PDF every night at 6pm.",
    features: [
      "10-page illustrated PDF every night",
      "Personalised story & art",
      "Delivered to your inbox at 6pm SAST",
    ],
  },
  pdf_audio: {
    label: "PDF + Audio narration",
    shortLabel: "PDF + Audio",
    description: "Illustrated PDF plus a calm narrated MP3 — perfect when you want a gentle voice to read aloud.",
    features: [
      "Everything in Storybook PDF",
      "Calm female narrator MP3 each night",
      "Natural pause after each page",
      "Play from email or your dashboard",
    ],
  },
};

export function monthlyTotal(childCount: number, plan: StoryPlan = "pdf"): number {
  if (childCount < 1) return 0;
  const base = plan === "pdf_audio" ? BASE_AUDIO_MONTHLY_ZAR : BASE_MONTHLY_ZAR;
  return base + Math.max(0, childCount - 1) * ADDON_CHILD_ZAR;
}

export function annualTotal(childCount: number, plan: StoryPlan = "pdf"): number {
  return monthlyTotal(childCount, plan) * ANNUAL_MONTHS_CHARGED;
}

export function annualSavings(childCount: number, plan: StoryPlan = "pdf"): number {
  return monthlyTotal(childCount, plan) * (ANNUAL_MONTHS_INCLUDED - ANNUAL_MONTHS_CHARGED);
}

export function recurringCharge(
  childCount: number,
  interval: BillingInterval,
  plan: StoryPlan = "pdf"
): number {
  return interval === "annual" ? annualTotal(childCount, plan) : monthlyTotal(childCount, plan);
}

export function perStoryPrice(childCount: number, plan: StoryPlan = "pdf"): string {
  const total = monthlyTotal(childCount, plan);
  const perNight = total / 30;
  return perNight.toFixed(2);
}

export function formatZar(amount: number): string {
  return `R${amount.toFixed(0)}`;
}

export function formatPlanSummary(
  childCount: number,
  interval: BillingInterval,
  plan: StoryPlan = "pdf"
): string {
  if (interval === "annual") {
    return `${formatZar(annualTotal(childCount, plan))}/year (save ${formatZar(annualSavings(childCount, plan))} — 1 month free)`;
  }
  return `${formatZar(monthlyTotal(childCount, plan))}/month`;
}

export function storyPlanLabel(plan: StoryPlan): string {
  return STORY_PLANS[plan].label;
}

export function includesNarration(plan: StoryPlan | string | null | undefined): boolean {
  return plan === "pdf_audio";
}

/** Extra monthly cost to move from PDF to PDF + Audio (same child count). */
export function audioPlanUpgradeDelta(childCount: number): number {
  return monthlyTotal(childCount, "pdf_audio") - monthlyTotal(childCount, "pdf");
}

export function billingIntervalLabel(interval: BillingInterval): string {
  return interval === "annual" ? "Annual" : "Monthly";
}

export function billingCadenceLabel(interval: BillingInterval): string {
  return interval === "annual" ? "year" : "month";
}
