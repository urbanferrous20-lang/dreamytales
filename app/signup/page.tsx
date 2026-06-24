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
    <div className="py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl text-navy mb-2">Start your free trial</h1>
        <p className="text-navy/60">Personalised bedtime short stories begin after a quick questionnaire.</p>
      </div>
      <SignupWizard />
    </div>
  );
}
