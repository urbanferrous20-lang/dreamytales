"use client";

import { useEffect, useState } from "react";
import {
  calculateCacMetrics,
  formatCacZar,
  formatSpendInputValue,
  MARKETING_SPEND_STORAGE_KEY,
  parseMarketingSpendInput,
} from "@/lib/cac";
import { formatZar } from "@/lib/pricing";

type MarketingSpendCacPanelProps = {
  activeSubscribers: number;
  subscriptionsTotal: number;
};

export function MarketingSpendCacPanel({
  activeSubscribers,
  subscriptionsTotal,
}: MarketingSpendCacPanelProps) {
  const [spendInput, setSpendInput] = useState("");
  const [savedSpend, setSavedSpend] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MARKETING_SPEND_STORAGE_KEY);
      if (stored) {
        const amount = parseMarketingSpendInput(stored);
        setSavedSpend(amount);
        setSpendInput(formatSpendInputValue(amount));
      }
    } catch {
      // localStorage unavailable
    }
    setHydrated(true);
  }, []);

  function handleInputChange(value: string) {
    setSpendInput(value);
  }

  function handleBlur() {
    const amount = parseMarketingSpendInput(spendInput);
    setSavedSpend(amount);
    setSpendInput(formatSpendInputValue(amount));
    try {
      if (amount > 0) {
        localStorage.setItem(MARKETING_SPEND_STORAGE_KEY, String(amount));
      } else {
        localStorage.removeItem(MARKETING_SPEND_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }

  const displaySpend = spendInput.trim() ? parseMarketingSpendInput(spendInput) : savedSpend;

  const metrics = calculateCacMetrics({
    marketingSpendZar: displaySpend,
    activeSubscribers,
    subscriptionsTotal,
  });

  const primaryCac = metrics.cacPerActive ?? metrics.cacPerSubscription;
  const primaryLabel = metrics.cacPerActive
    ? "per active subscriber"
    : metrics.cacPerSubscription
      ? "per subscription (all time)"
      : null;

  return (
    <section className="mb-8 bg-white rounded-2xl border border-navy/5 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-sky/15 via-mint/20 to-purple/10 px-6 py-4 border-b border-navy/5">
        <h2 className="font-display text-xl text-navy">Customer Acquisition Cost (CAC)</h2>
        <p className="text-sm text-navy/60 mt-1">
          Enter your total marketing spend to see how much each subscriber costs to acquire.
        </p>
      </div>

      <div className="p-6 grid lg:grid-cols-[minmax(0,280px)_1fr] gap-8 items-start">
        <div>
          <label htmlFor="marketing-spend" className="block text-sm font-medium text-navy mb-2">
            Total marketing spend (ZAR)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/50 font-medium">
              R
            </span>
            <input
              id="marketing-spend"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={spendInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-full border border-navy/20 rounded-xl pl-9 pr-4 py-3 text-navy text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-sky/40 focus:border-sky"
            />
          </div>
          <p className="text-xs text-navy/45 mt-2">
            {hydrated
              ? "Saved in this browser. Include ads, promos, and agency fees."
              : "Loading saved spend…"}
          </p>
        </div>

        <div className="rounded-2xl bg-navy text-cream p-6 md:p-8">
          {!displaySpend ? (
            <div>
              <p className="text-cream/60 text-sm uppercase tracking-wide font-semibold mb-2">
                CAC
              </p>
              <p className="font-display text-3xl md:text-4xl font-bold text-cream/90">
                Enter spend above
              </p>
              <p className="text-sm text-cream/50 mt-3">
                Formula: total marketing spend ÷ subscribers acquired
              </p>
            </div>
          ) : primaryCac === null ? (
            <div>
              <p className="text-cream/60 text-sm uppercase tracking-wide font-semibold mb-2">
                CAC
              </p>
              <p className="font-display text-3xl md:text-4xl font-bold text-gold">
                {formatZar(displaySpend)} spent
              </p>
              <p className="text-sm text-cream/60 mt-3">
                No subscribers yet — CAC will calculate once you have active subscriptions.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gold text-sm uppercase tracking-wide font-bold mb-2">
                Customer acquisition cost
              </p>
              <p className="font-display text-5xl md:text-6xl font-bold tabular-nums text-cream leading-none mb-2">
                {formatCacZar(primaryCac)}
              </p>
              {primaryLabel && (
                <p className="text-cream/70 text-sm mb-4">{primaryLabel}</p>
              )}
              <p className="text-sm text-cream/55 font-mono bg-cream/5 rounded-lg px-3 py-2 inline-block">
                {formatZar(displaySpend)} ÷{" "}
                {metrics.cacPerActive ? activeSubscribers : subscriptionsTotal} ={" "}
                {formatCacZar(primaryCac)}
              </p>
            </div>
          )}

          {displaySpend > 0 && (
            <dl className="mt-6 pt-6 border-t border-cream/10 grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-cream/50">CAC · active subscribers</dt>
                <dd className="text-lg font-semibold tabular-nums mt-1">
                  {metrics.cacPerActive ? formatCacZar(metrics.cacPerActive) : "—"}
                </dd>
                <dd className="text-xs text-cream/45 mt-0.5">
                  {formatZar(displaySpend)} ÷ {activeSubscribers} active
                </dd>
              </div>
              <div>
                <dt className="text-cream/50">CAC · all subscriptions</dt>
                <dd className="text-lg font-semibold tabular-nums mt-1">
                  {metrics.cacPerSubscription ? formatCacZar(metrics.cacPerSubscription) : "—"}
                </dd>
                <dd className="text-xs text-cream/45 mt-0.5">
                  {formatZar(displaySpend)} ÷ {subscriptionsTotal} total ever
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
