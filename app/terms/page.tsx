import { JsonLd } from "@/components/JsonLd";
import { CONTACT_EMAIL } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo-content";

export const metadata = createPageMetadata({
  title: "Terms & Conditions — Dreamy Tales",
  description:
    "Terms and conditions for the Dreamy Tales personalised bedtime short story subscription service in South Africa.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Terms & Conditions", path: "/terms" },
        ])}
      />
    <article className="max-w-3xl mx-auto py-12 px-4 prose prose-navy">
      <h1 className="font-display text-3xl text-navy mb-2">Terms & Conditions</h1>
      <p className="text-navy/60 text-sm mb-8">Last updated: {new Date().toLocaleDateString("en-ZA")}</p>

      <section className="space-y-6 text-navy/80 text-sm leading-relaxed">
        <div>
          <h2 className="font-display text-xl text-navy mb-2">1. Introduction</h2>
          <p>
            These Terms and Conditions (&quot;Terms&quot;) govern your use of the Dreamy Tales service
            (&quot;Service&quot;), operated in the Republic of South Africa. By subscribing, you agree to these
            Terms.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">2. Service Description</h2>
          <p>
            Dreamy Tales provides personalised, AI-generated bedtime short stories delivered as illustrated PDF
            documents to your registered email address daily at approximately 18:00 South African Standard Time
            (SAST). Stories are tailored based on the child profile information you provide during signup.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">3. Pricing & Billing</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Storybook PDF (first child): R99 per month</li>
            <li>PDF + Audio narration (first child): R149 per month — illustrated PDF plus a calm MP3 read-aloud each night</li>
            <li>Each additional child: R50 per month (same plan tier as your subscription)</li>
            <li>Annual billing: pay for 11 months and receive 12 months of service (one month free)</li>
            <li>A 7-day free trial is offered. No charge is made during the trial period.</li>
            <li>After the trial, your subscription renews via PayFast recurring billing (monthly or annually, as selected).</li>
            <li>All prices are in South African Rand (ZAR) and include VAT where applicable.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">4. Payment Processing</h2>
          <p>
            Payments are processed securely by PayFast (Pty) Ltd. We do not store your credit card details.
            PayFast&apos;s terms apply to all payment transactions. See{" "}
            <a href="https://www.payfast.co.za" className="text-gold underline" target="_blank" rel="noopener">
              payfast.co.za
            </a>{" "}
            for their terms.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">5. Cancellation</h2>
          <p>
            You may cancel your subscription at any time through your dashboard. Cancellation requires{" "}
            <strong>one calendar month&apos;s notice</strong>. You will continue to receive stories until the
            end of your notice period. No further charges will be made after that date. We will cancel your
            PayFast recurring billing on your access end date.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">6. Consumer Protection Act (CPA)</h2>
          <p>
            In accordance with the Consumer Protection Act 68 of 2008, we provide clear pricing in ZAR before
            checkout. Direct marketing communications require your consent. You have the right to fair and
            honest dealing. Refunds for partial months are not offered unless required by law.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">7. Content Disclaimer</h2>
          <p>
            Stories are generated using artificial intelligence based on information you provide. While we
            strive for age-appropriate, calming content, parents/guardians are responsible for reviewing
            stories before reading them to children. Dreamy Tales is not liable for any distress caused by
            story content.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">8. Intellectual Property</h2>
          <p>
            Generated stories are licensed to you for personal, non-commercial use within your household.
            You may not redistribute, sell, or publish stories without written permission.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">9. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be
            subject to the jurisdiction of the courts of South Africa.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl text-navy mb-2">10. Contact</h2>
          <p>
            Questions about these Terms:{" "}
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
