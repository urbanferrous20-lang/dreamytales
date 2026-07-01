import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { HeroStoryPreview, SampleStoryShowcase } from "@/components/SampleStoryShowcase";
import { PublicReviews } from "@/components/PublicReviews";
import {
  ADDON_CHILD_ZAR,
  BASE_AUDIO_MONTHLY_ZAR,
  BASE_MONTHLY_ZAR,
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
  },
  {
    emoji: "😴",
    text: "You: 'One more story.' Us: 'Here's 30. You're welcome.'",
  },
  {
    emoji: "⏰",
    text: "6pm sharp. Story in your inbox. No hunting for the lost bookmark.",
  },
  {
    emoji: "🎨",
    text: "Custom illustrations. Your child's name. Their favourite things. Not generic fluff.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Tell us about your child",
    desc: `Name, age, interests, hometown, and story language — ${STORY_LANGUAGE_MARKETING_LABEL}.`,
  },
  {
    step: "2",
    title: "Start your free trial",
    desc: `${TRIAL_DAYS} days free. Card details via PayFast. Cancel anytime with 1 month's notice.`,
  },
  {
    step: "3",
    title: "Stories arrive at 6pm",
    desc: "Every night, a brand-new illustrated PDF lands in your inbox. Ready to read.",
  },
];

const CREATIVE_FEATURES = [
  { icon: "🕐", label: "New story every night at 6pm" },
  { icon: "A", label: STORY_LANGUAGE_MARKETING_LABEL },
  { icon: "📄", label: "Illustrated PDF to your inbox" },
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
      {/* Hero — launch-creative starry night */}
      <section className="gradient-hero text-cream relative overflow-hidden">
        <div className="absolute inset-0 stars-bg opacity-60 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-16 left-[8%] text-3xl animate-twinkle text-gold-light">✦</span>
          <span className="absolute top-28 right-[12%] text-2xl animate-twinkle text-gold-light" style={{ animationDelay: "0.4s" }}>★</span>
          <span className="absolute top-48 left-[35%] text-xl animate-twinkle text-cream/50" style={{ animationDelay: "0.8s" }}>✦</span>
          <span className="absolute bottom-24 right-[25%] text-4xl animate-twinkle text-gold-light" style={{ animationDelay: "1.2s" }}>★</span>
          <span className="absolute top-32 right-[40%] text-5xl animate-float-slow opacity-20">🌙</span>
          <span className="absolute bottom-16 left-[15%] text-4xl animate-drift opacity-25">☁️</span>
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold/8 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />
        </div>

        {/* Trial seal — like launch creative */}
        <div
          className="absolute top-8 right-8 hidden lg:flex seal-trial w-28 h-28 rounded-full flex-col items-center justify-center text-center z-10 animate-float-slow"
          aria-hidden="true"
        >
          <span className="text-[11px] font-bold uppercase leading-tight tracking-wide">{TRIAL_DAYS}-day</span>
          <span className="text-sm font-bold uppercase tracking-wider">FREE</span>
          <span className="text-[11px] font-bold uppercase leading-tight">trial</span>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold/70 mb-4">
                dreamytales.co.za
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.12] mb-5 text-gold-light">
                Personalised bedtime stories
              </h1>
              <p className="text-lg md:text-xl text-cream/90 mb-2 leading-relaxed max-w-lg">
                30+ custom illustrated stories · {formatZar(BASE_MONTHLY_ZAR)}/month
              </p>
              <p className="text-cream/65 mb-8 leading-relaxed max-w-lg text-sm md:text-base">
                Less than{" "}
                <strong className="text-gold-light">R{perStoryPrice(1)} per magical night</strong>.
                Written for <em className="text-gold-light not-italic">your</em> child, about{" "}
                <em className="text-gold-light not-italic">their</em> world — delivered at 6pm SAST.
              </p>

              <ul className="space-y-3 mb-8">
                {CREATIVE_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm text-cream/85">
                    <span className="icon-ring-gold text-xs font-semibold">{f.icon}</span>
                    {f.label}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link
                  href="/signup"
                  className="btn-gold px-8 py-4 rounded-full text-center text-lg animate-pulse-glow"
                >
                  Start tonight →
                </Link>
                <Link
                  href="#sample-story"
                  className="border border-gold/35 text-gold-light px-8 py-4 rounded-full text-center hover:bg-gold/10 transition-all"
                >
                  See a sample story
                </Link>
              </div>
              <p className="text-cream/40 text-xs">
                No charge for {TRIAL_DAYS} days · Cancel with 1 month&apos;s notice
              </p>
            </div>

            <div className="hidden lg:block">
              <HeroStoryPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Memes */}
      <section className="py-16 bg-cream pattern-dots">
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
                className="relative card-creative rounded-2xl p-6 card-hover overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60" />
                <span className="text-4xl mb-4 block">{meme.emoji}</span>
                <p className="text-navy/85 text-sm leading-relaxed font-medium">&ldquo;{meme.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SampleStoryShowcase />

      {/* How it works */}
      <section id="how-it-works" className="py-20 gradient-hero-warm text-cream relative overflow-hidden">
        <div className="absolute inset-0 stars-bg opacity-30 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-14">
            <span className="inline-block border border-gold/30 text-gold-light text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
              Simple as 1-2-3
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-gold-light mb-3">How it works</h2>
            <p className="text-cream/60 max-w-xl mx-auto">
              Three steps between you and never running out of bedtime short stories again.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((item, i) => (
              <div
                key={item.step}
                className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 text-center card-hover border border-gold/15"
              >
                {i < STEPS.length - 1 && (
                  <span className="hidden md:block absolute top-10 -right-4 text-gold/30 text-2xl z-10">→</span>
                )}
                <div className="w-14 h-14 rounded-full border-2 border-gold/50 bg-gold/10 text-gold-light font-bold text-xl flex items-center justify-center mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="font-display text-xl text-gold-light mb-3">{item.title}</h3>
                <p className="text-cream/65 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-cream relative">
        <div className="absolute inset-0 pattern-dots opacity-40" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-12">
            <span className="inline-block border border-gold/40 text-gold text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4 bg-gold/5">
              No surprises
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-navy mb-3">Simple, honest pricing</h2>
            <p className="text-navy/60">One price. Thirty-plus stories. No hidden fees. Pay yearly and get one month free.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            <div className="relative card-creative rounded-3xl p-8 card-hover border-2 border-gold/50 overflow-hidden">
              <div className="absolute top-0 right-0 bg-gold text-navy text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                Most popular
              </div>
              <p className="text-gold font-semibold text-sm uppercase tracking-wide mb-2">Storybook PDF</p>
              <p className="font-display text-5xl font-bold text-navy mb-1">{formatZar(BASE_MONTHLY_ZAR)}</p>
              <p className="text-navy/50 text-sm mb-6">per month · ~R{perStoryPrice(1, "pdf")}/story</p>
              <ul className="space-y-3 text-sm text-navy/80 mb-8">
                {["30+ illustrated PDFs per month", "Personalised story & art every night", "Delivered at 6pm SAST", `${TRIAL_DAYS}-day free trial`].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gold/15 text-gold flex items-center justify-center text-xs">✓</span>
                      {item}
                    </li>
                  )
                )}
              </ul>
              <Link href="/signup" className="block w-full btn-gold text-center py-3.5 rounded-full">
                Start free trial
              </Link>
            </div>
            <div className="relative card-creative rounded-3xl p-8 card-hover border-2 border-navy/15 overflow-hidden">
              <div className="absolute top-0 right-0 bg-navy text-gold-light text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                PDF + Audio
              </div>
              <p className="text-navy font-semibold text-sm uppercase tracking-wide mb-2">With narration</p>
              <p className="font-display text-5xl font-bold text-navy mb-1">{formatZar(BASE_AUDIO_MONTHLY_ZAR)}</p>
              <p className="text-navy/50 text-sm mb-6">per month · calm female voice</p>
              <ul className="space-y-3 text-sm text-navy/80 mb-8">
                {["Everything in Storybook PDF", "MP3 narration each night", "Gentle pause after each page", `${TRIAL_DAYS}-day free trial`].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gold/15 text-gold flex items-center justify-center text-xs">✓</span>
                      {item}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/signup"
                className="block w-full bg-navy text-gold-light text-center py-3.5 rounded-full font-medium hover:bg-navy-soft transition-colors"
              >
                Start with audio
              </Link>
            </div>
          </div>
          <div className="grid md:grid-cols-1 gap-8 max-w-3xl mx-auto mb-8">
            <div className="card-creative rounded-3xl p-8 card-hover">
              <p className="text-gold font-semibold text-sm uppercase tracking-wide mb-2">Each additional child</p>
              <p className="font-display text-5xl font-bold text-navy mb-1">{formatZar(ADDON_CHILD_ZAR)}</p>
              <p className="text-navy/50 text-sm mb-6">per month · their own nightly story</p>
              <ul className="space-y-3 text-sm text-navy/80 mb-8">
                {["Separate personalised story stream", "Own questionnaire & character", "Add during signup or later", `Same ${TRIAL_DAYS}-day trial applies`].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gold/15 text-gold flex items-center justify-center text-xs">✓</span>
                      {item}
                    </li>
                  )
                )}
              </ul>
              <div className="text-center bg-gold/8 border border-gold/20 rounded-2xl py-4 px-4">
                <p className="text-navy/70 text-sm font-medium">
                  2 children = <span className="text-navy font-bold">{formatZar(monthlyTotal(2))}/mo</span> total
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative gradient-hero-warm rounded-3xl p-8 border border-gold/25 shadow-lg card-hover overflow-hidden text-cream">
              <div className="absolute inset-0 stars-bg opacity-40 pointer-events-none" />
              <div className="absolute top-0 right-0 bg-gold text-navy text-xs font-bold px-4 py-1.5 rounded-bl-2xl z-10">
                Best value
              </div>
              <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center relative">
                <div>
                  <p className="text-gold-light font-semibold text-sm uppercase tracking-wide mb-2">Pay annually</p>
                  <h3 className="font-display text-2xl text-gold-light mb-2">Get 1 month free</h3>
                  <p className="text-cream/70 text-sm leading-relaxed">
                    Pay for 11 months, receive 12 months of nightly stories. Same great service — less per year.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-cream/80">
                    <li className="flex items-center gap-2">
                      <span className="text-gold">✓</span> PDF — 1 child: {formatZar(annualTotal(1, "pdf"))}/year
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold">✓</span> PDF — 2 children: {formatZar(annualTotal(2, "pdf"))}/year
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold">✓</span> PDF + Audio — 1 child: {formatZar(annualTotal(1, "pdf_audio"))}/year
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold">✓</span> PDF + Audio — 2 children: {formatZar(annualTotal(2, "pdf_audio"))}/year
                    </li>
                  </ul>
                </div>
                <Link href="/signup" className="shrink-0 btn-gold px-8 py-3.5 rounded-full text-center relative z-10">
                  Choose annual at signup
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicReviews />

      {/* FAQ */}
      <section id="faq" className="py-20 bg-cream" aria-labelledby="faq-heading">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-3xl mb-3 block" aria-hidden="true">💬</span>
            <h2 id="faq-heading" className="font-display text-3xl text-navy">Questions? We&apos;ve got you.</h2>
          </div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="card-creative rounded-2xl p-6 border-l-4 border-l-gold group card-hover"
              >
                <summary className="font-medium text-navy cursor-pointer list-none flex justify-between items-center gap-4">
                  {item.q}
                  <span className="shrink-0 w-8 h-8 rounded-full bg-gold/15 text-gold group-open:rotate-45 transition-transform text-xl flex items-center justify-center">
                    +
                  </span>
                </summary>
                <p className="text-navy/70 text-sm mt-4 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="gradient-hero text-cream py-20 relative overflow-hidden">
        <div className="absolute inset-0 stars-bg opacity-50 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-8 left-[10%] text-2xl animate-twinkle text-gold-light">✦</span>
          <span className="absolute bottom-12 right-[15%] text-3xl animate-float">🌙</span>
          <span className="absolute top-1/2 left-[5%] text-4xl animate-drift opacity-30">☁️</span>
        </div>
        <div className="max-w-2xl mx-auto px-4 text-center relative">
          <span className="text-5xl mb-6 block animate-float-slow">✨</span>
          <h2 className="font-display text-3xl md:text-4xl mb-4 text-gold-light">
            Tonight could be the easiest bedtime yet.
          </h2>
          <p className="text-cream/75 mb-10 text-lg">
            Join parents who&apos;ve traded story-time stress for an inbox full of magic.
          </p>
          <Link
            href="/signup"
            className="inline-block btn-gold px-10 py-4 rounded-full text-lg animate-pulse-glow"
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
