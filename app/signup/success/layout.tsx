import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Welcome to Dreamy Tales",
  description: "Your Dreamy Tales subscription is being activated. Your first personalised bedtime short story arrives tonight at 6pm SAST.",
  path: "/signup/success",
  noIndex: true,
});

export default function SignupSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
