import { JsonLd } from "@/components/JsonLd";
import { CONTACT_EMAIL } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo-content";

export const metadata = createPageMetadata({
  title: "Privacy Policy — Dreamy Tales",
  description:
    "How Dreamy Tales collects, uses, and protects your personal information under POPIA (South Africa).",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />
    <article className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="font-display text-3xl text-navy mb-2">Privacy Policy</h1>
      <p className="text-navy/60 text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-ZA")}</p>

      <section className="space-y-6 text-navy/80 text-sm leading-relaxed">
        <div>
          <h2 className="font-display text-xl text-navy mb-2">1. Overview</h2>
          <p>
            Dreamy Tales (&quot;we&quot;, &quot;us&quot;) is committed to protecting your personal information in
            accordance with the Protection of Personal Information Act 4 of 2013 (POPIA). This policy explains
            what data we collect, why, and your rights.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Parent data:</strong> name, email address, account password (hashed)</li>
            <li><strong>Child data:</strong> name, age, interests, preferences provided in the questionnaire</li>
            <li><strong>Payment data:</strong> processed by PayFast — we receive transaction confirmations only</li>
            <li><strong>Usage data:</strong> story delivery logs, subscription status</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">3. Purpose of Processing</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Generate personalised bedtime short stories for your child</li>
            <li>Deliver stories to your email at 6pm SAST</li>
            <li>Manage your subscription and billing via PayFast</li>
            <li>Communicate service updates and cancellation confirmations</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">4. Children&apos;s Data</h2>
          <p>
            We collect child information only with explicit parental consent during signup. This data is used
            solely to personalise stories. We do not market directly to children. Parents may request deletion
            of child data by contacting us or cancelling their subscription.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">5. Third-Party Processors</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>PayFast:</strong> payment processing</li>
            <li><strong>DeepSeek / OpenAI:</strong> story text and illustration generation (server-side only)</li>
            <li><strong>1-grid (Plesk):</strong> hosting, MySQL, and email delivery</li>
          </ul>
          <p className="mt-2">API keys for AI services are stored securely and never exposed to your browser.</p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">6. Data Retention</h2>
          <p>
            We retain your account data for as long as your subscription is active, plus a reasonable period
            thereafter for legal and accounting purposes. Story PDFs are emailed to you each night and kept on
            our servers for up to <strong>90 days</strong> so you can re-download them from your dashboard;
            after that, server copies are deleted automatically (your email copy remains yours). You may
            request deletion of your account and associated data at any time.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">7. Your Rights (POPIA)</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Withdraw consent for direct marketing</li>
            <li>Lodge a complaint with the Information Regulator</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">8. Security</h2>
          <p>
            Passwords are hashed. API keys and payment credentials are stored in encrypted environment
            variables. All AI processing happens server-side. We use HTTPS in production.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">9. Contact</h2>
          <p>
            Privacy enquiries:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <p className="text-navy/50 text-xs italic border-t border-navy/10 pt-6">
          This document is a template and does not constitute legal advice. We recommend review by a
          qualified South African attorney before launch.
        </p>
      </section>
    </article>
    </>
  );
}
