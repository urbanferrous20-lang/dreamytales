export const BASE_MONTHLY_ZAR = 99;
export const ADDON_CHILD_ZAR = 50;
export const TRIAL_DAYS = 7;
export const ANNUAL_MONTHS_CHARGED = 11;
export const ANNUAL_MONTHS_INCLUDED = 12;

export type BillingInterval = "monthly" | "annual";

export function monthlyTotal(childCount: number): number {
  if (childCount < 1) return 0;
  return BASE_MONTHLY_ZAR + Math.max(0, childCount - 1) * ADDON_CHILD_ZAR;
}

export function annualTotal(childCount: number): number {
  return monthlyTotal(childCount) * ANNUAL_MONTHS_CHARGED;
}

export function annualSavings(childCount: number): number {
  return monthlyTotal(childCount) * (ANNUAL_MONTHS_INCLUDED - ANNUAL_MONTHS_CHARGED);
}

export function recurringCharge(childCount: number, interval: BillingInterval): number {
  return interval === "annual" ? annualTotal(childCount) : monthlyTotal(childCount);
}

export function perStoryPrice(childCount: number): string {
  const total = monthlyTotal(childCount);
  const perNight = total / 30;
  return perNight.toFixed(2);
}

export function formatZar(amount: number): string {
  return `R${amount.toFixed(0)}`;
}

export function formatPlanSummary(childCount: number, interval: BillingInterval): string {
  if (interval === "annual") {
    return `${formatZar(annualTotal(childCount))}/year (save ${formatZar(annualSavings(childCount))} — 1 month free)`;
  }
  return `${formatZar(monthlyTotal(childCount))}/month`;
}

export function billingIntervalLabel(interval: BillingInterval): string {
  return interval === "annual" ? "Annual" : "Monthly";
}

export function billingCadenceLabel(interval: BillingInterval): string {
  return interval === "annual" ? "year" : "month";
}
