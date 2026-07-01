import Image from "next/image";
import Link from "next/link";
import { SAMPLE_STORY } from "@/lib/sample-story";

export function HeroStoryPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gold/15 rounded-[2rem] blur-2xl opacity-70" />
      <div className="relative gradient-border rounded-[1.75rem] p-1 shadow-2xl shadow-black/30 animate-float-slow">
        <div className="rounded-[1.5rem] overflow-hidden bg-navy/20">
          <div className="flex items-center justify-between px-4 py-3 bg-navy/90 border-b border-gold/15">
            <span className="text-[10px] font-semibold text-gold-light/70 uppercase tracking-wider">Sample story</span>
            <span className="text-[10px] border border-gold/30 text-gold-light px-2 py-0.5 rounded-full font-medium">PDF · 6pm delivery</span>
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
          <div className="px-4 py-4 bg-gradient-to-br from-navy-light to-navy border-t border-gold/10">
            <h3 className="font-display text-lg text-gold-light leading-snug mb-1">{SAMPLE_STORY.title}</h3>
            <p className="text-cream/60 text-xs leading-relaxed line-clamp-2">{SAMPLE_STORY.teaser}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Personalised", "Illustrated", SAMPLE_STORY.location].map((tag) => (
                <span key={tag} className="text-[10px] border border-gold/25 text-gold-light/80 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <span className="absolute -top-6 -right-4 text-4xl animate-float pointer-events-none">✨</span>
      <span className="absolute -bottom-4 -left-6 text-3xl animate-drift pointer-events-none text-gold-light">★</span>
    </div>
  );
}

export function SampleStoryShowcase() {
  return (
    <section id="sample-story" className="py-20 gradient-hero-warm text-cream relative overflow-hidden">
      <div className="absolute inset-0 stars-bg opacity-35 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <div>
            <span className="inline-block border border-gold/30 text-gold-light text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
              Real sample
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-gold-light mb-4">
              See what lands in your inbox
            </h2>
            <p className="text-cream/70 leading-relaxed mb-6">
              Every night you receive a colourful illustrated PDF — written for your child&apos;s name, age,
              interests, and hometown. This is a page from an actual Dreamy Tales sample story.
            </p>
            <ul className="space-y-3 text-sm text-cream/80 mb-8">
              <li className="flex items-start gap-3">
                <span className="icon-ring-gold text-[10px]">✓</span>
                Custom story text — never generic templates
              </li>
              <li className="flex items-start gap-3">
                <span className="icon-ring-gold text-[10px]">✓</span>
                AI illustrations on every page
              </li>
              <li className="flex items-start gap-3">
                <span className="icon-ring-gold text-[10px]">✓</span>
                Easy to read on phone or tablet at bedtime
              </li>
            </ul>
            <Link href="/signup" className="inline-block btn-gold px-8 py-3.5 rounded-full">
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
                <figcaption className="mt-3 text-center text-xs text-cream/50 font-medium">{page.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <p className="text-center text-cream/35 text-xs mt-10">
          Sample: <em>{SAMPLE_STORY.title}</em> · {SAMPLE_STORY.location} · {SAMPLE_STORY.theme}
        </p>
      </div>
    </section>
  );
}
