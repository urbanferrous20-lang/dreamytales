import { SignupWizard } from "@/components/SignupWizard";
import { createPageMetadata } from "@/lib/seo";
import { TRIAL_DAYS } from "@/lib/pricing";

export const metadata = createPageMetadata({
  title: `Start Your ${TRIAL_DAYS}-Day Free Trial — Dreamy Tales`,
  description:
    "Sign up for personalised bedtime short stories delivered nightly at 6pm SAST. " +
    "Tell us about your child, choose your language, and start your free trial with PayFast.",
  path: "/signup",
});

export default function SignupPage() {
  return (
    <>
      <div className="gradient-hero text-cream py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 stars-bg opacity-40 pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative">
          <span className="text-3xl mb-3 block animate-float">🌙</span>
          <h1 className="font-display text-3xl md:text-4xl text-gold-light mb-2">Start your free trial</h1>
          <p className="text-cream/70">Personalised bedtime short stories begin after a quick questionnaire.</p>
        </div>
      </div>
      <div className="py-12 px-4 bg-cream">
        <SignupWizard />
      </div>
    </>
  );
}
