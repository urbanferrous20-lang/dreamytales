import { formatZar } from "@/lib/pricing";

export const MARKETING_SPEND_STORAGE_KEY = "dreamytales_total_marketing_spend_zar";

export type CacMetrics = {
  marketingSpendZar: number;
  activeSubscribers: number;
  subscriptionsTotal: number;
  cacPerActive: number | null;
  cacPerSubscription: number | null;
};

export function parseMarketingSpendInput(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function calculateCacMetrics(params: {
  marketingSpendZar: number;
  activeSubscribers: number;
  subscriptionsTotal: number;
}): CacMetrics {
  const { marketingSpendZar, activeSubscribers, subscriptionsTotal } = params;

  return {
    marketingSpendZar,
    activeSubscribers,
    subscriptionsTotal,
    cacPerActive:
      marketingSpendZar > 0 && activeSubscribers > 0
        ? marketingSpendZar / activeSubscribers
        : null,
    cacPerSubscription:
      marketingSpendZar > 0 && subscriptionsTotal > 0
        ? marketingSpendZar / subscriptionsTotal
        : null,
  };
}

/** CAC often needs cents — use 2 decimals under R1,000. */
export function formatCacZar(amount: number): string {
  if (amount >= 1000) return formatZar(amount);
  if (amount >= 100) return `R${amount.toFixed(0)}`;
  return `R${amount.toFixed(2)}`;
}

export function formatSpendInputValue(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return amount % 1 === 0 ? String(amount) : amount.toFixed(2);
}
