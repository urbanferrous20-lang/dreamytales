"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AffiliateMonthlyRow } from "@/lib/affiliate";
import { formatZar } from "@/lib/pricing";
import { slugifyAffiliateCode } from "@/lib/affiliate-client";

type PartnerRow = {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  commissionAmount: number;
  active: boolean;
  notes: string | null;
  conversionCount: number;
  signupUrl: string;
  shortUrl: string;
};

type ConversionDisplay = Omit<AffiliateConversionRow, "convertedAt" | "paidAt"> & {
  convertedAt: string;
  paidAt: string | null;
};

type AffiliateAdminPanelProps = {
  month: string;
  report: AffiliateMonthlyRow[];
  conversions: ConversionDisplay[];
  partners: PartnerRow[];
};

export function AffiliateAdminPanel({
  month,
  report,
  conversions,
  partners: initialPartners,
}: AffiliateAdminPanelProps) {
  const router = useRouter();
  const [partners, setPartners] = useState(initialPartners);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);

  const pendingTotal = report.reduce((sum, row) => sum + row.pendingTotal, 0);
  const owedTotal = report.reduce((sum, row) => sum + row.commissionTotal, 0);

  async function handleCreatePartner(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setCreating(true);

    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code: code.trim() || slugifyAffiliateCode(name),
          contactName,
          contactEmail,
        }),
      });
      const data = (await res.json()) as { error?: string; partner?: PartnerRow };
      if (!res.ok) throw new Error(data.error ?? "Could not create partner");

      setPartners((current) =>
        [...current, { ...data.partner!, conversionCount: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setName("");
      setCode("");
      setContactName("");
      setContactEmail("");
      setMessage(`Created ${data.partner!.name} (${data.partner!.code})`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function togglePartnerActive(partner: PartnerRow) {
    setError("");
    const res = await fetch(`/api/admin/affiliates/${partner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !partner.active }),
    });
    if (!res.ok) {
      setError("Could not update partner");
      return;
    }
    setPartners((current) =>
      current.map((row) => (row.id === partner.id ? { ...row, active: !row.active } : row))
    );
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied");
    } catch {
      setError("Could not copy link");
    }
  }

  async function markMonthPaid(partnerId?: string) {
    setError("");
    setMarkingPaid(true);
    try {
      const res = await fetch("/api/admin/affiliates/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, partnerId }),
      });
      const data = (await res.json()) as { error?: string; updated?: number };
      if (!res.ok) throw new Error(data.error ?? "Could not mark as paid");
      setMessage(`Marked ${data.updated ?? 0} conversion(s) as paid`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMarkingPaid(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-coral bg-coral/10 rounded-lg p-3">{error}</p> : null}
      {message ? <p className="text-sm text-mint bg-mint/10 rounded-lg p-3">{message}</p> : null}

      <section className="bg-white rounded-2xl border border-navy/5 shadow-sm p-6">
        <h2 className="font-display text-xl text-navy mb-1">Add school partner</h2>
        <p className="text-sm text-navy/50 mb-4">
          Create a code when a school agrees to promote Dreamy Tales. Parents use the link silently — no
          referral field on signup.
        </p>
        <form onSubmit={handleCreatePartner} className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs text-navy/50">School name</span>
            <input
              className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-navy"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!code) setCode(slugifyAffiliateCode(e.target.value));
              }}
              required
              placeholder="Springs Primary"
            />
          </label>
          <label className="block">
            <span className="text-xs text-navy/50">Code</span>
            <input
              className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-navy font-mono text-sm"
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
              placeholder="springs-primary"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
            />
          </label>
          <label className="block">
            <span className="text-xs text-navy/50">Contact name (optional)</span>
            <input
              className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-navy"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-navy/50">Contact email (optional)</span>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-navy"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-gold text-navy px-5 py-2 rounded-full font-medium disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create partner"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-2xl border border-navy/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-navy/5">
          <h2 className="font-display text-xl text-navy">School partners</h2>
          <p className="text-sm text-navy/50 mt-1">R5 commission on first paid month only (not free trial)</p>
        </div>
        {partners.length === 0 ? (
          <p className="px-6 py-8 text-navy/50 text-sm">No partners yet.</p>
        ) : (
          <div className="divide-y divide-navy/5">
            {partners.map((partner) => (
              <div key={partner.id} className="px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy">
                      {partner.name}{" "}
                      <span className="font-mono text-sm text-navy/50">({partner.code})</span>
                    </p>
                    <p className="text-sm text-navy/50 mt-1">
                      {formatZar(partner.commissionAmount)} per first paid signup · {partner.conversionCount}{" "}
                      paid conversion{partner.conversionCount === 1 ? "" : "s"} all time
                    </p>
                    {partner.contactEmail ? (
                      <p className="text-xs text-navy/40 mt-1">{partner.contactEmail}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyLink(partner.shortUrl)}
                      className="text-xs border border-navy/10 px-3 py-1 rounded-full text-navy/70 hover:text-navy"
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePartnerActive(partner)}
                      className={`text-xs px-3 py-1 rounded-full border ${
                        partner.active
                          ? "border-mint/30 text-mint bg-mint/10"
                          : "border-navy/10 text-navy/40"
                      }`}
                    >
                      {partner.active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-navy/40 mt-2 font-mono break-all">{partner.shortUrl}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-navy/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-navy/5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-navy">Monthly payout report</h2>
            <p className="text-sm text-navy/50 mt-1">
              {month} · {formatZar(owedTotal)} earned · {formatZar(pendingTotal)} pending
            </p>
          </div>
          <form className="flex flex-wrap items-center gap-2" action="/admin/affiliates" method="get">
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="rounded-xl border border-navy/10 px-3 py-2 text-navy text-sm"
            />
            <button type="submit" className="text-sm border border-navy/10 px-3 py-2 rounded-full text-navy/70">
              View month
            </button>
            <a
              href={`/api/admin/affiliates/export?month=${encodeURIComponent(month)}`}
              className="text-sm border border-navy/10 px-3 py-2 rounded-full text-navy/70"
            >
              Export CSV
            </a>
            <button
              type="button"
              disabled={markingPaid || pendingTotal <= 0}
              onClick={() => markMonthPaid()}
              className="text-sm bg-navy text-cream px-3 py-2 rounded-full disabled:opacity-50"
            >
              Mark all pending paid
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-navy/50 border-b border-navy/5">
                <th className="px-6 py-3 font-medium">School</th>
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Paid signups</th>
                <th className="px-6 py-3 font-medium">Owed</th>
                <th className="px-6 py-3 font-medium">Pending</th>
                <th className="px-6 py-3 font-medium">Paid out</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {report.map((row) => (
                <tr key={row.partnerId} className="border-b border-navy/5 last:border-0">
                  <td className="px-6 py-3 text-navy">{row.name}</td>
                  <td className="px-6 py-3 font-mono text-navy/70">{row.code}</td>
                  <td className="px-6 py-3 text-navy">{row.conversions}</td>
                  <td className="px-6 py-3 text-navy">{formatZar(row.commissionTotal)}</td>
                  <td className="px-6 py-3 text-navy">{formatZar(row.pendingTotal)}</td>
                  <td className="px-6 py-3 text-navy">{formatZar(row.paidTotal)}</td>
                  <td className="px-6 py-3">
                    {row.pendingTotal > 0 ? (
                      <button
                        type="button"
                        disabled={markingPaid}
                        onClick={() => markMonthPaid(row.partnerId)}
                        className="text-xs text-navy/60 hover:text-navy underline"
                      >
                        Mark paid
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-navy/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-navy/5">
          <h2 className="font-display text-xl text-navy">Conversion detail — {month}</h2>
        </div>
        {conversions.length === 0 ? (
          <p className="px-6 py-8 text-navy/50 text-sm">No paid conversions this month yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-navy/50 border-b border-navy/5">
                  <th className="px-6 py-3 font-medium">School</th>
                  <th className="px-6 py-3 font-medium">Parent</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Commission</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {conversions.map((row) => (
                  <tr key={row.id} className="border-b border-navy/5 last:border-0">
                    <td className="px-6 py-3 text-navy">{row.partnerName}</td>
                    <td className="px-6 py-3 text-navy">
                      {row.parentName}
                      <span className="block text-xs text-navy/40">{row.parentEmail}</span>
                    </td>
                    <td className="px-6 py-3 text-navy">
                      {new Date(row.convertedAt).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3 text-navy">{formatZar(row.commissionAmount)}</td>
                    <td className="px-6 py-3 text-navy capitalize">{row.payoutStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
