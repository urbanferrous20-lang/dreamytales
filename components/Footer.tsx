import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-navy text-cream/80 mt-auto relative overflow-hidden">
      <div className="absolute inset-0 stars-bg opacity-40 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8 text-sm relative">
        <div>
          <p className="font-display text-lg text-gold-light mb-1">Dreamy Tales</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-cream/40 mb-3">
            Personalised bedtime stories
          </p>
          <p className="text-cream/60">
            Custom bedtime short stories for South African families. Delivered at 6pm SAST every night.
          </p>
        </div>
        <div>
          <p className="font-medium text-gold-light mb-2">Legal</p>
          <ul className="space-y-1">
            <li>
              <Link href="/terms" className="hover:text-gold transition-colors">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-gold transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-gold-light mb-2">Contact</p>
          <p className="text-cream/60">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-gold transition-colors">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-cream/40 text-xs mt-4">
            Payments processed securely by PayFast (Pty) Ltd.
          </p>
        </div>
      </div>
      <div className="border-t border-gold/10 text-center py-4 text-xs text-cream/40 relative">
        © {new Date().getFullYear()} Dreamy Tales · dreamytales.co.za
      </div>
    </footer>
  );
}
