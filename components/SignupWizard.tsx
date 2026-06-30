"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackAnalyticsEvent } from "@/components/AnalyticsTracker";
import { getStoredAffiliateCode } from "@/lib/affiliate-client";
import {
  INTEREST_OPTIONS,
  type BillingInterval,
  type ChildProfileInput,
  type SignupInput,
  isChildLocationComplete,
  getResolvedCity,
  defaultBirthDateForAge,
} from "@/lib/types/child";
import { ageFromBirthDate, birthDateInputBounds, parseBirthDate } from "@/lib/child-age";
import { SA_PROVINCES, CITIES_BY_PROVINCE, type SAProvince } from "@/lib/sa-locations";
import { ACTIVE_STORY_LANGUAGES, STORY_LANGUAGE_MARKETING_LABEL, getLanguageLabel } from "@/lib/sa-languages";
import {
  annualSavings,
  annualTotal,
  formatPlanSummary,
  formatZar,
  monthlyTotal,
  recurringCharge,
  TRIAL_DAYS,
} from "@/lib/pricing";

const EMPTY_CHILD: ChildProfileInput = {
  name: "",
  birthDate: defaultBirthDateForAge(5),
  age: 5,
  pronouns: "they/them",
  interests: [],
  favoriteColors: "",
  province: "Gauteng",
  cityOrTown: "Johannesburg",
  storyMood: "gentle",
  readAloudBy: "parent",
  language: "english",
};

const COLOR_OPTIONS = ["Blue", "Pink", "Green", "Purple", "Red", "Yellow", "Orange", "Rainbow"];

export function SignupWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parent, setParent] = useState({ name: "", email: "", password: "" });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [children, setChildren] = useState<ChildProfileInput[]>([{ ...EMPTY_CHILD }]);
  const [activeChild, setActiveChild] = useState(0);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

  useEffect(() => {
    trackAnalyticsEvent("signup_start");
  }, []);

  function updateChild(index: number, updates: Partial<ChildProfileInput>) {
    setChildren((prev) => prev.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  }

  function toggleInterest(index: number, interest: string) {
    const child = children[index];
    const interests = child.interests.includes(interest)
      ? child.interests.filter((i) => i !== interest)
      : [...child.interests, interest];
    updateChild(index, { interests });
  }

  function addChild() {
    setChildren((prev) => [...prev, { ...EMPTY_CHILD }]);
    setActiveChild(children.length);
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const payload: SignupInput = {
      ...parent,
      agreedToTerms: agreedToTerms as true,
      billingInterval,
      children,
      affiliateCode: getStoredAffiliateCode() ?? undefined,
    };

    try {
      sessionStorage.setItem("dreamytales_signup_email", parent.email.trim().toLowerCase());
      sessionStorage.setItem("dreamytales_signup_password", parent.password);

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") ?? "";

      if (!res.ok) {
        let message = "Signup failed. Please try again.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // ignore non-JSON error bodies
        }
        throw new Error(message);
      }

      if (contentType.includes("text/html")) {
        const html = await res.text();
        document.open();
        document.write(html);
        document.close();
        return;
      }

      const data = await res.json();
      if (data.checkoutForm) {
        submitPayfastForm(data.checkoutForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function submitPayfastForm(formData: Record<string, string>) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = formData._action;
    delete formData._action;

    for (const [key, value] of Object.entries(formData)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  const monthly = monthlyTotal(children.length);
  const charge = recurringCharge(children.length, billingInterval);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-8">
        {["Your details", "About your child", "Review & pay"].map((label, i) => (
          <div
            key={label}
            className={`flex-1 text-center text-xs py-2 rounded-full ${
              step === i ? "bg-navy text-cream" : step > i ? "bg-gold/30 text-navy" : "bg-navy/10 text-navy/50"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>
      )}

      {step === 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-navy/5 space-y-4">
          <h2 className="font-display text-2xl text-navy mb-2">Create your account</h2>
          <p className="text-navy/60 text-sm mb-6">Stories will be sent to this email every night at 6pm.</p>
          <Field label="Your name" value={parent.name} onChange={(v) => setParent({ ...parent, name: v })} />
          <Field label="Email" type="email" value={parent.email} onChange={(v) => setParent({ ...parent, email: v })} />
          <Field
            label="Password"
            type="password"
            value={parent.password}
            onChange={(v) => setParent({ ...parent, password: v })}
          />
          <label className="flex items-start gap-3 text-sm text-navy/70 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-gold underline" target="_blank">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-gold underline" target="_blank">
                Privacy Policy
              </Link>
            </span>
          </label>
          <button
            onClick={() => setStep(1)}
            disabled={!parent.name || !parent.email || parent.password.length < 8 || !agreedToTerms}
            className="w-full bg-navy text-cream py-3 rounded-full font-medium disabled:opacity-40 hover:bg-navy-light transition-colors"
          >
            Next: Tell us about your child →
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-navy/5">
          <div className="flex gap-2 mb-6 flex-wrap">
            {children.map((child, i) => (
              <button
                key={i}
                onClick={() => setActiveChild(i)}
                className={`px-4 py-2 rounded-full text-sm ${
                  activeChild === i ? "bg-navy text-cream" : "bg-navy/10 text-navy"
                }`}
              >
                {child.name || `Child ${i + 1}`}
              </button>
            ))}
            <button onClick={addChild} className="px-4 py-2 rounded-full text-sm border border-dashed border-navy/30 text-navy/60">
              + Add child
            </button>
          </div>

          <ChildForm
            child={children[activeChild]}
            onChange={(updates) => updateChild(activeChild, updates)}
            onToggleInterest={(interest) => toggleInterest(activeChild, interest)}
          />

          <div className="flex gap-3 mt-8">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-full border border-navy/20 text-navy">
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={
                !children.every(
                  (c) => c.name && c.interests.length > 0 && c.favoriteColors && isChildLocationComplete(c)
                )
              }
              className="flex-1 bg-navy text-cream py-3 rounded-full font-medium disabled:opacity-40"
            >
              Review →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-navy/5">
          <h2 className="font-display text-2xl text-navy mb-6">Almost there!</h2>
          <div className="bg-moon rounded-xl p-6 mb-6 space-y-2 text-sm">
            <p>
              <strong>Account:</strong> {parent.email}
            </p>
            {children.map((c, i) => (
              <p key={i}>
                <strong>{c.name}</strong> (age {c.age}) — {getResolvedCity(c)}, {c.province} ·{" "}
                {getLanguageLabel(c.language)}
              </p>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-navy mb-3">Choose billing</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  billingInterval === "monthly"
                    ? "border-navy bg-navy/5 shadow-sm"
                    : "border-navy/10 hover:border-navy/25"
                }`}
              >
                <p className="font-semibold text-navy">Monthly</p>
                <p className="text-lg font-display text-navy mt-1">{formatZar(monthly)}/month</p>
                <p className="text-xs text-navy/50 mt-1">Pay month to month</p>
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("annual")}
                className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                  billingInterval === "annual"
                    ? "border-gold bg-gold/10 shadow-sm"
                    : "border-navy/10 hover:border-gold/40"
                }`}
              >
                <span className="absolute -top-2.5 right-3 bg-gold text-navy text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                  1 month free
                </span>
                <p className="font-semibold text-navy">Annual</p>
                <p className="text-lg font-display text-navy mt-1">{formatZar(annualTotal(children.length))}/year</p>
                <p className="text-xs text-navy/50 mt-1">
                  Save {formatZar(annualSavings(children.length))} · 12 months for the price of 11
                </p>
              </button>
            </div>
          </div>

          <div className="bg-moon rounded-xl p-4 mb-6 text-sm border border-navy/5">
            <p>
              <strong>After {TRIAL_DAYS}-day free trial:</strong> {formatPlanSummary(children.length, billingInterval)}
            </p>
            <p className="text-navy/60 mt-1">
              PayFast charge: <strong>{formatZar(charge)}</strong> per {billingInterval === "annual" ? "year" : "month"}
            </p>
          </div>
          <p className="text-navy/60 text-sm mb-6">
            You&apos;ll be redirected to PayFast to securely set up your subscription. No charge for the first{" "}
            {TRIAL_DAYS} days.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-full border border-navy/20 text-navy">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gold text-navy py-3 rounded-full font-semibold disabled:opacity-40"
            >
              {loading ? "Setting up..." : `Start ${TRIAL_DAYS}-day free trial →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-navy/20 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold/50"
      />
    </div>
  );
}

function ChildForm({
  child,
  onChange,
  onToggleInterest,
}: {
  child: ChildProfileInput;
  onChange: (updates: Partial<ChildProfileInput>) => void;
  onToggleInterest: (interest: string) => void;
}) {
  const dobBounds = birthDateInputBounds();
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Child's first name" value={child.name} onChange={(v) => onChange({ name: v })} />
        <div>
          <label className="block text-sm font-medium text-navy mb-1">Date of birth</label>
          <input
            type="date"
            value={child.birthDate}
            min={dobBounds.min}
            max={dobBounds.max}
            onChange={(e) => {
              const birthDate = e.target.value;
              const parsed = parseBirthDate(birthDate);
              const age = parsed ? ageFromBirthDate(parsed) : child.age;
              onChange({ birthDate, age });
            }}
            className="w-full border border-navy/20 rounded-xl px-4 py-3 text-navy"
            required
          />
          <p className="text-xs text-navy/50 mt-1">
            Ages 3–12. We update story difficulty automatically as they grow.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">Pronouns</label>
        <div className="flex gap-2">
          {(["he/him", "she/her", "they/them"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ pronouns: p })}
              className={`px-4 py-2 rounded-full text-sm ${
                child.pronouns === p ? "bg-navy text-cream" : "bg-navy/10 text-navy"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-2">What do they love? (pick a few)</label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => onToggleInterest(interest)}
              className={`px-3 py-1.5 rounded-full text-sm capitalize ${
                child.interests.includes(interest) ? "bg-gold text-navy" : "bg-navy/10 text-navy/70"
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-2">Favourite colour</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ favoriteColors: color })}
              className={`px-3 py-1.5 rounded-full text-sm ${
                child.favoriteColors === color ? "bg-gold text-navy" : "bg-navy/10 text-navy/70"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-navy/10 pt-5">
        <h3 className="font-medium text-navy mb-1">Where in South Africa?</h3>
        <p className="text-sm text-navy/60 mb-4">
          Their hometown anchors each story — with new adventures in forests, coasts, mountains, and
          magical places too.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Province</label>
            <select
              value={child.province}
              onChange={(e) => {
                const province = e.target.value as SAProvince;
                const cities = CITIES_BY_PROVINCE[province];
                onChange({
                  province,
                  cityOrTown: cities[0],
                  customCity: undefined,
                });
              }}
              className="w-full border border-navy/20 rounded-xl px-4 py-3 text-navy"
            >
              {SA_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">City or town</label>
            <select
              value={child.cityOrTown}
              onChange={(e) =>
                onChange({
                  cityOrTown: e.target.value,
                  customCity: e.target.value === "Other" ? child.customCity : undefined,
                })
              }
              className="w-full border border-navy/20 rounded-xl px-4 py-3 text-navy"
            >
              {CITIES_BY_PROVINCE[child.province].map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
        {child.cityOrTown === "Other" && (
          <div className="mt-4">
            <Field
              label="Your city or town"
              value={child.customCity ?? ""}
              onChange={(v) => onChange({ customCity: v })}
            />
          </div>
        )}
        <div className="mt-4">
          <Field
            label="Suburb or neighbourhood (optional)"
            value={child.suburb ?? ""}
            onChange={(v) => onChange({ suburb: v || undefined })}
          />
        </div>
        <Field
          label="Favourite place at home (optional, e.g. the garden, their bedroom)"
          value={child.favoritePlace ?? ""}
          onChange={(v) => onChange({ favoritePlace: v || undefined })}
        />
      </div>

      <Field
        label="Favourite toy or comfort object (optional)"
        value={child.favoriteToy ?? ""}
        onChange={(v) => onChange({ favoriteToy: v || undefined })}
      />
      <Field
        label="Pet (optional, e.g. 'Buddy the golden retriever')"
        value={child.petInfo ?? ""}
        onChange={(v) => onChange({ petInfo: v || undefined })}
      />
      <Field
        label="Topics to avoid (optional)"
        value={child.topicsToAvoid ?? ""}
        onChange={(v) => onChange({ topicsToAvoid: v || undefined })}
      />

      <div>
        <label className="block text-sm font-medium text-navy mb-1">Story language</label>
        <p className="text-xs text-navy/50 mb-2">
          Every nightly story is written in your chosen language — {STORY_LANGUAGE_MARKETING_LABEL}. More SA languages coming soon.
        </p>
        <select
          value={child.language}
          onChange={(e) =>
            onChange({ language: e.target.value as ChildProfileInput["language"] })
          }
          className="w-full border border-navy/20 rounded-xl px-4 py-3 text-navy"
        >
          {ACTIVE_STORY_LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">Story mood</label>
        <select
          value={child.storyMood}
          onChange={(e) => onChange({ storyMood: e.target.value as ChildProfileInput["storyMood"] })}
          className="w-full border border-navy/20 rounded-xl px-4 py-3 text-navy"
        >
          <option value="gentle">Gentle & calming</option>
          <option value="adventurous">Adventurous</option>
          <option value="funny">Funny</option>
          <option value="educational">Educational</option>
        </select>
      </div>
    </div>
  );
}
