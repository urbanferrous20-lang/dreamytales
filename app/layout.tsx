import "./globals.css";
import Script from "next/script";
import { SiteChrome } from "@/components/SiteChrome";
import { META_PIXEL_ID, metaPixelEnabled } from "@/lib/meta-pixel";
import { rootMetadata } from "@/lib/seo";

export const metadata = rootMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-readable site summary" />
        {metaPixelEnabled() ? (
          <>
            <Script id="meta-pixel-base" strategy="afterInteractive">
              {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
              `.trim()}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        ) : null}
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
