import Link from "next/link";
import { getSession } from "@/lib/auth";

export async function Header() {
  const session = await getSession();

  return (
    <header className="border-b border-gold/15 bg-navy/95 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl animate-float inline-block drop-shadow-[0_0_8px_rgba(201,169,98,0.4)]">🌙</span>
          <div className="leading-tight">
            <span className="font-display text-lg font-bold text-gold-light group-hover:text-gold transition-colors tracking-wide">
              Dreamy Tales
            </span>
            <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-cream/45">
              Personalised bedtime stories
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/#pricing" className="text-cream/70 hover:text-gold-light hidden sm:inline transition-colors">
            Pricing
          </Link>
          <Link href="/#faq" className="text-cream/70 hover:text-gold-light hidden sm:inline transition-colors">
            FAQ
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className="border border-gold/40 text-gold-light px-4 py-2 rounded-full hover:bg-gold/10 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-cream/70 hover:text-cream transition-colors">
                Log in
              </Link>
              <Link href="/signup" className="btn-gold px-4 py-2 rounded-full text-sm">
                Start free trial
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
