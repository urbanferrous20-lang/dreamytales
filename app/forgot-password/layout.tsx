import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Reset Password — Dreamy Tales",
  description: "Request a password reset link for your Dreamy Tales parent account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
