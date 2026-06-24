import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { rootMetadata } from "@/lib/seo";

export const metadata = rootMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-readable site summary" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
