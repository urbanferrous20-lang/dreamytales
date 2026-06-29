import { headers } from "next/headers";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { MetaPixelPageViews } from "@/components/MetaPixel";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <AnalyticsTracker />
      <MetaPixelPageViews />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
