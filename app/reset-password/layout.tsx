import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Set New Password — Dreamy Tales",
  description: "Set a new password for your Dreamy Tales parent account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
