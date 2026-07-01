"use client";

import { useState } from "react";
import {
  audioPlanUpgradeDelta,
  formatPlanSummary,
  formatZar,
  STORY_PLANS,
  type BillingInterval,
} from "@/lib/pricing";

type Props = {
  childCount: number;
  billingInterval: BillingInterval;
  currentRecurringAmount: number;
};

export function PlanUpgradePanel({ childCount, billingInterval, currentRecurringAmount }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const upgradeSummary = formatPlanSummary(childCount, billingInterval, "pdf_audio");
  const monthlyDelta = audioPlanUpgradeDelta(childCount);

  async function handleUpgrade() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/upgrade-plan", { method: "POST" });
      const data = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok) {
        throw new Error(data.error ?? "Upgrade failed");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-purple/10 border border-purple/30 rounded-2xl p-6 mb-10">
        <h2 className="font-medium text-navy mb-2">PDF + Audio active</h2>
        <p className="text-sm text-navy/70">
          You&apos;re upgraded. Tonight&apos;s story arrives in <strong>one email</strong> with the PDF and MP3
          narration attached. Refresh this page to see your updated plan.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple/10 to-moon rounded-2xl p-6 border border-purple/25 mb-10">
      <h2 className="font-display text-xl text-navy mb-2">Add calm audio narration</h2>
      <p className="text-sm text-navy/70 mb-4">
        {STORY_PLANS.pdf_audio.description} A gentle female voice reads each page, with a pause between pages — in the
        same nightly email as your PDF.
      </p>
      <ul className="text-sm text-navy/80 space-y-1 mb-4">
        {STORY_PLANS.pdf_audio.features.slice(1).map((item) => (
          <li key={item}>✓ {item}</li>
        ))}
      </ul>
      <div className="bg-white/70 rounded-xl p-4 text-sm mb-4 space-y-1">
        <p>
          <span className="text-navy/60">Current:</span> {formatZar(currentRecurringAmount)}/
          {billingInterval === "annual" ? "year" : "month"} (PDF only)
        </p>
        <p>
          <span className="text-navy/60">After upgrade:</span>{" "}
          <strong>{upgradeSummary}</strong>
        </p>
        {billingInterval === "monthly" && monthlyDelta > 0 && (
          <p className="text-navy/50 text-xs">
            +{formatZar(monthlyDelta)}/month for audio narration ({childCount}{" "}
            {childCount === 1 ? "child" : "children"}).
          </p>
        )}
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={loading}
        className="bg-gradient-to-r from-purple to-navy text-cream px-6 py-3 rounded-full font-medium disabled:opacity-50 hover:brightness-110 transition-all"
      >
        {loading ? "Upgrading…" : "Upgrade to PDF + Audio"}
      </button>
      <p className="text-xs text-navy/50 mt-3">
        PayFast recurring billing updates on your next charge. Audio starts with tonight&apos;s story if you upgrade
        before 6pm SAST.
      </p>
    </div>
  );
}
