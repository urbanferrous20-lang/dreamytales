import Image from "next/image";
import Link from "next/link";
import { SAMPLE_STORY } from "@/lib/sample-story";

export function HeroStoryPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-to-br from-gold/30 via-purple/20 to-sky/30 rounded-[2rem] blur-2xl opacity-60" />
      <div className="relative gradient-border rounded-[1.75rem] p-1 shadow-2xl shadow-purple/20 animate-float-slow">
        <div className="rounded-[1.5rem] overflow-hidden bg-navy/5">
          <div className="flex items-center justify-between px-4 py-3 bg-white/90 border-b border-navy/5">
            <span className="text-[10px] font-semibold text-navy/50 uppercase tracking-wider">Sample story</span>
            <span className="text-[10px] bg-sky/15 text-sky px-2 py-0.5 rounded-full font-medium">PDF · 6pm delivery</span>
          </div>
          <div className="relative aspect-[3/4] w-full max-w-[320px] mx-auto bg-moon">
            <Image
              src={SAMPLE_STORY.heroPage}
              alt={`Sample Dreamy Tales page from "${SAMPLE_STORY.title}"`}
              fill
              priority
              sizes="(max-width: 1024px) 80vw, 320px"
              className="object-cover object-top"
            />
          </div>
          <div className="px-4 py-4 bg-gradient-to-br from-moon via-lavender/40 to-peach/20">
            <h3 className="font-display text-lg text-navy leading-snug mb-1">{SAMPLE_STORY.title}</h3>
            <p className="text-navy/60 text-xs leading-relaxed line-clamp-2">{SAMPLE_STORY.teaser}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Personalised", "Illustrated", SAMPLE_STORY.location].map((tag) => (
                <span key={tag} className="text-[10px] bg-white/80 text-navy/70 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <span className="absolute -top-6 -right-4 text-4xl animate-float pointer-events-none">✨</span>
      <span className="absolute -bottom-4 -left-6 text-3xl animate-drift pointer-events-none">🌟</span>
    </div>
  );
}

export function SampleStoryShowcase() {
  return (
    <section id="sample-story" className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-peach/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-sky/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <div>
            <span className="inline-block bg-coral/15 text-coral text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
              Real sample
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-navy mb-4">
              See what lands in your inbox
            </h2>
            <p className="text-navy/70 leading-relaxed mb-6">
              Every night you receive a colourful illustrated PDF — written for your child&apos;s name, age,
              interests, and hometown. This is a page from an actual Dreamy Tales sample story.
            </p>
            <ul className="space-y-3 text-sm text-navy/80 mb-8">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-mint/25 text-mint shrink-0 flex items-center justify-center text-xs">✓</span>
                Custom story text — never generic templates
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple/20 text-purple shrink-0 flex items-center justify-center text-xs">✓</span>
                AI illustrations on every page
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-gold/25 text-gold shrink-0 flex items-center justify-center text-xs">✓</span>
                Easy to read on phone or tablet at bedtime
              </li>
            </ul>
            <Link
              href="/signup"
              className="inline-block bg-navy text-cream px-8 py-3.5 rounded-full font-medium hover:bg-navy-light transition-colors shadow-lg shadow-navy/15"
            >
              Get stories like this for your child →
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {SAMPLE_STORY.pages.map((page, i) => (
              <figure
                key={page.src}
                className={`group relative ${i === 1 ? "sm:-translate-y-3" : i === 2 ? "sm:translate-y-1" : ""}`}
              >
                <div className="gradient-border rounded-2xl p-1 shadow-lg card-hover">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-moon">
                    <Image
                      src={page.src}
                      alt={page.alt}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 30vw, 220px"
                      className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                </div>
                <figcaption className="mt-3 text-center text-xs text-navy/60 font-medium">{page.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <p className="text-center text-navy/45 text-xs mt-10">
          Sample: <em>{SAMPLE_STORY.title}</em> · {SAMPLE_STORY.location} · {SAMPLE_STORY.theme}
        </p>
      </div>
    </section>
  );
}
