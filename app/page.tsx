import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { HeroStoryPreview, SampleStoryShowcase } from "@/components/SampleStoryShowcase";
import { PublicReviews } from "@/components/PublicReviews";
import {
  ADDON_CHILD_ZAR,
  BASE_MONTHLY_ZAR,
  annualSavings,
  annualTotal,
  formatZar,
  monthlyTotal,
  perStoryPrice,
  TRIAL_DAYS,
} from "@/lib/pricing";
import { createPageMetadata } from "@/lib/seo";
import {
  buildFaqJsonLd,
  buildOrganizationJsonLd,
  buildServiceJsonLd,
  buildWebSiteJsonLd,
  FAQ_ITEMS,
} from "@/lib/seo-content";
import { STORY_LANGUAGE_MARKETING_LABEL } from "@/lib/sa-languages";

export const metadata = createPageMetadata({
  title: "Dreamy Tales — Personalised Bedtime Short Stories Delivered Nightly | South Africa",
  description:
    "Custom illustrated bedtime short stories in your inbox every night at 6pm SAST. " +
    `${formatZar(BASE_MONTHLY_ZAR)}/month, ${STORY_LANGUAGE_MARKETING_LABEL}, ${TRIAL_DAYS}-day free trial. ` +
    "Stories written for your child's name, age, and interests.",
  path: "/",
});

const MEMES = [
  {
    emoji: "📚",
    text: "Finally, a bedtime short story that isn't the same dinosaur book for the 400th time.",
    bg: "from-coral/20 via-peach/30 to-sunset/20",
    accent: "bg-coral",
  },
  {
    emoji: "😴",
    text: "You: 'One more story.' Us: 'Here's 30. You're welcome.'",
    bg: "from-sky/25 via-mint/20 to-sky/10",
    accent: "bg-sky",
  },
  {
    emoji: "⏰",
    text: "6pm sharp. Story in your inbox. No hunting for the lost bookmark.",
    bg: "from-purple/25 via-lavender to-rose/15",
    accent: "bg-purple",
  },
  {
    emoji: "🎨",
    text: "Custom illustrations. Your child's name. Their favourite things. Not generic fluff.",
    bg: "from-gold-light/40 via-peach/25 to-coral/15",
    accent: "bg-sunset",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Tell us about your child",
    desc: `Name, age, interests, hometown, and story language — ${STORY_LANGUAGE_MARKETING_LABEL}.`,
    color: "bg-coral",
    ring: "ring-coral/30",
  },
  {
    step: "2",
    title: "Start your free trial",
    desc: `${TRIAL_DAYS} days free. Card details via PayFast. Cancel anytime with 1 month's notice.`,
    color: "bg-sky",
    ring: "ring-sky/30",
  },
  {
    step: "3",
    title: "Stories arrive at 6pm",
    desc: "Every night, a brand-new illustrated PDF lands in your inbox. Ready to read.",
    color: "bg-mint",
    ring: "ring-mint/30",
  },
];

const HIGHLIGHTS = [
  { icon: "🌍", label: STORY_LANGUAGE_MARKETING_LABEL, color: "bg-purple/15 text-purple" },
  { icon: "🌙", label: "Delivered at 6pm", color: "bg-sky/15 text-sky" },
  { icon: "✨", label: `${TRIAL_DAYS}-day free trial`, color: "bg-gold/20 text-gold" },
  { icon: "📖", label: "30+ stories/month", color: "bg-coral/15 text-coral" },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          buildOrganizationJsonLd(),
          buildWebSiteJsonLd(),
          buildServiceJsonLd(),
          buildFaqJsonLd(),
        ]}
      />
      {/* Hero */}
      <section className="gradient-hero text-cream relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-16 left-[8%] text-3xl animate-twinkle">✦</span>
          <span className="absolute top-28 right-[12%] text-2xl animate-twinkle text-gold-light" style={{ animationDelay: "0.4s" }}>★</span>
          <span className="absolute top-48 left-[35%] text-xl animate-twinkle text-sky" style={{ animationDelay: "0.8s" }}>✦</span>
          <span className="absolute bottom-24 right-[25%] text-4xl animate-twinkle" style={{ animationDelay: "1.2s" }}>★</span>
          <span className="absolute top-32 right-[40%] text-5xl animate-float-slow opacity-30">🌙</span>
          <span className="absolute bottom-16 left-[15%] text-4xl animate-drift opacity-40">📖</span>
          <span className="absolute top-20 right-[8%] text-3xl animate-float opacity-50">⭐</span>
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-coral/15 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 text-gold-light text-xs font-medium tracking-wide uppercase mb-6">
                <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
                For parents who&apos;ve read &ldquo;Goodnight Moon&rdquo; one too many times
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] mb-6">
                30+ custom bedtime short stories.{" "}
                <span className="gradient-text">{formatZar(BASE_MONTHLY_ZAR)}/month.</span>
              </h1>
              <p className="text-lg text-cream/85 mb-8 leading-relaxed max-w-lg">
                Less than{" "}
                <strong className="text-peach">R{perStoryPrice(1)} per magical night</strong>.
                Personalised illustrated PDFs in your inbox at 6pm — written for{" "}
                <em className="text-gold-light not-italic font-medium">your</em> child, about{" "}
                <em className="text-sky not-italic font-medium">their</em> world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-gold via-sunset to-coral text-navy px-8 py-4 rounded-full font-semibold text-center hover:brightness-110 transition-all text-lg shadow-lg shadow-coral/25 animate-pulse-glow"
                >
                  Start {TRIAL_DAYS}-day free trial →
                </Link>
                <Link
                  href="#sample-story"
                  className="border-2 border-cream/25 text-cream px-8 py-4 rounded-full text-center hover:bg-white/10 hover:border-sky/50 transition-all backdrop-blur-sm"
                >
                  See a sample story
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {HIGHLIGHTS.map((h) => (
                  <span
                    key={h.label}
                    className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-xs text-cream/90"
                  >
                    <span>{h.icon}</span>
                    {h.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Sample story preview */}
            <div className="hidden lg:block">
              <HeroStoryPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Memes */}
      <section className="py-16 bg-gradient-to-b from-moon via-cream to-cream pattern-dots">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block text-3xl mb-3">😅</span>
            <h2 className="font-display text-3xl text-navy">Sound familiar?</h2>
            <p className="text-navy/50 mt-2 text-sm">Real parent problems. Dreamy Tales solutions.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MEMES.map((meme) => (
              <div
                key={meme.text}
                className={`relative bg-gradient-to-br ${meme.bg} rounded-2xl p-6 shadow-md card-hover border border-white/80 overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 w-full h-1 ${meme.accent}`} />
                <span className="text-4xl mb-4 block">{meme.emoji}</span>
                <p className="text-navy/85 text-sm leading-relaxed font-medium">&ldquo;{meme.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SampleStoryShowcase />

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-lavender/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-mint/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-14">
            <span className="inline-block bg-sky/15 text-sky text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
              Simple as 1-2-3
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-navy mb-3">How it works</h2>
            <p className="text-navy/60 max-w-xl mx-auto">
              Three steps between you and never running out of bedtime short stories again.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((item, i) => (
              <div
                key={item.step}
                className={`relative bg-cream/80 rounded-3xl p-8 text-center card-hover ring-4 ${item.ring} border border-navy/5`}
              >
                {i < STEPS.length - 1 && (
                  <span className="hidden md:block absolute top-10 -right-4 text-gold/40 text-2xl z-10">→</span>
                )}
                <div
                  className={`w-14 h-14 rounded-2xl ${item.color} text-white font-bold text-xl flex items-center justify-center mx-auto mb-5 shadow-lg`}
                >
                  {item.step}
                </div>
                <h3 className="font-display text-xl text-navy mb-3">{item.title}</h3>
                <p className="text-navy/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-lavender/50 via-moon to-peach/20 relative">
        <div className="absolute inset-0 pattern-dots opacity-50" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-12">
            <span className="inline-block bg-gold/20 text-gold text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
              No surprises
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-navy mb-3">Simple, honest pricing</h2>
            <p className="text-navy/60">One price. Thirty-plus stories. No hidden fees. Pay yearly and get one month free.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-8">
            <div className="relative bg-white rounded-3xl p-8 shadow-xl card-hover border-2 border-gold overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-gold to-sunset text-navy text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                Most popular
              </div>
              <p className="text-gold font-semibold text-sm uppercase tracking-wide mb-2">First child</p>
              <p className="font-display text-5xl font-bold text-navy mb-1">{formatZar(BASE_MONTHLY_ZAR)}</p>
              <p className="text-navy/50 text-sm mb-6">per month · ~R{perStoryPrice(1)}/story</p>
              <ul className="space-y-3 text-sm text-navy/80 mb-8">
                {["30+ custom stories per month", "Illustrated PDF every night at 6pm", "Age-appropriate for 3–12", `${TRIAL_DAYS}-day free trial`].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-mint/30 text-mint flex items-center justify-center text-xs">✓</span>
                      {item}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/signup"
                className="block w-full bg-gradient-to-r from-navy to-navy-light text-cream text-center py-3.5 rounded-full font-medium hover:brightness-110 transition-all shadow-lg shadow-navy/20"
              >
                Start free trial
              </Link>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-3xl p-8 shadow-lg card-hover border-2 border-sky/30">
              <p className="text-sky font-semibold text-sm uppercase tracking-wide mb-2">Each additional child</p>
              <p className="font-display text-5xl font-bold text-navy mb-1">{formatZar(ADDON_CHILD_ZAR)}</p>
              <p className="text-navy/50 text-sm mb-6">per month · their own nightly story</p>
              <ul className="space-y-3 text-sm text-navy/80 mb-8">
                {["Separate personalised story stream", "Own questionnaire & character", "Add during signup or later", `Same ${TRIAL_DAYS}-day trial applies`].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-sky/25 text-sky flex items-center justify-center text-xs">✓</span>
                      {item}
                    </li>
                  )
                )}
              </ul>
              <div className="text-center bg-gradient-to-r from-sky/10 to-purple/10 rounded-2xl py-4 px-4">
                <p className="text-navy/70 text-sm font-medium">
                  2 children = <span className="text-navy font-bold">{formatZar(monthlyTotal(2))}/mo</span> total
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative bg-gradient-to-r from-purple/15 via-gold/20 to-mint/15 rounded-3xl p-8 border-2 border-gold/40 shadow-lg card-hover overflow-hidden">
              <div className="absolute top-0 right-0 bg-gold text-navy text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                Best value
              </div>
              <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
                <div>
                  <p className="text-purple font-semibold text-sm uppercase tracking-wide mb-2">Pay annually</p>
                  <h3 className="font-display text-2xl text-navy mb-2">Get 1 month free</h3>
                  <p className="text-navy/70 text-sm leading-relaxed">
                    Pay for 11 months, receive 12 months of nightly stories. Same great service — less per year.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-navy/80">
                    <li className="flex items-center gap-2">
                      <span className="text-gold">✓</span> 1 child: {formatZar(annualTotal(1))}/year (save {formatZar(annualSavings(1))})
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold">✓</span> 2 children: {formatZar(annualTotal(2))}/year (save {formatZar(annualSavings(2))})
                    </li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="shrink-0 bg-gradient-to-r from-navy to-purple text-cream px-8 py-3.5 rounded-full font-medium hover:brightness-110 transition-all text-center shadow-lg"
                >
                  Choose annual at signup
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicReviews />

      {/* FAQ — visible to users and mirrored in FAQPage JSON-LD */}
      <section id="faq" className="py-20 bg-cream" aria-labelledby="faq-heading">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-3xl mb-3 block" aria-hidden="true">💬</span>
            <h2 id="faq-heading" className="font-display text-3xl text-navy">Questions? We&apos;ve got you.</h2>
          </div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => {
              const accents = ["border-l-coral", "border-l-sky", "border-l-purple", "border-l-mint", "border-l-gold", "border-l-rose", "border-l-sunset"];
              return (
                <details
                  key={item.q}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-navy/5 border-l-4 ${accents[i % accents.length]} group card-hover`}
                >
                  <summary className="font-medium text-navy cursor-pointer list-none flex justify-between items-center gap-4">
                    {item.q}
                    <span className="shrink-0 w-8 h-8 rounded-full bg-gold/15 text-gold group-open:rotate-45 transition-transform text-xl flex items-center justify-center">
                      +
                    </span>
                  </summary>
                  <p className="text-navy/70 text-sm mt-4 leading-relaxed">{item.a}</p>
                </details>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="gradient-hero-warm text-cream py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-8 left-[10%] text-2xl animate-twinkle">✦</span>
          <span className="absolute bottom-12 right-[15%] text-3xl animate-float">🌙</span>
          <span className="absolute top-1/2 left-[5%] text-4xl animate-drift opacity-40">📚</span>
        </div>
        <div className="max-w-2xl mx-auto px-4 text-center relative">
          <span className="text-5xl mb-6 block animate-float-slow">✨</span>
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            Tonight could be the <span className="gradient-text">easiest bedtime yet.</span>
          </h2>
          <p className="text-cream/75 mb-10 text-lg">
            Join parents who&apos;ve traded story-time stress for an inbox full of magic.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-gradient-to-r from-gold via-peach to-coral text-navy px-10 py-4 rounded-full font-semibold text-lg hover:brightness-110 transition-all shadow-xl shadow-coral/30 animate-pulse-glow"
          >
            Start your {TRIAL_DAYS}-day free trial
          </Link>
          <p className="text-cream/45 text-sm mt-6">
            No charge for {TRIAL_DAYS} days · Cancel with 1 month&apos;s notice
          </p>
        </div>
      </section>
    </>
  );
}
