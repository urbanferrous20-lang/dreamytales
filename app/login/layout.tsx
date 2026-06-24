import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sign In — Dreamy Tales",
  description: "Sign in to your Dreamy Tales parent dashboard to download bedtime short stories and manage your subscription.",
  path: "/login",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
