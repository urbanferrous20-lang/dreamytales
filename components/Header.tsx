import Link from "next/link";
import { getSession } from "@/lib/auth";

export async function Header() {
  const session = await getSession();

  return (
    <header className="border-b border-navy/10 bg-cream/90 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-navy/5">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl animate-float inline-block">🌙</span>
          <span className="font-display text-xl font-bold text-navy group-hover:text-gold transition-colors">
            Dreamy Tales
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/#pricing" className="text-navy/70 hover:text-navy hidden sm:inline">
            Pricing
          </Link>
          <Link href="/#faq" className="text-navy/70 hover:text-navy hidden sm:inline">
            FAQ
          </Link>
          {session ? (
            <Link
              href="/dashboard"
              className="bg-navy text-cream px-4 py-2 rounded-full hover:bg-navy-light transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-navy/70 hover:text-navy">
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-gold text-navy px-4 py-2 rounded-full font-medium hover:bg-gold-light transition-colors"
              >
                Start free trial
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
