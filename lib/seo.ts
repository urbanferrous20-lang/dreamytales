import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_IMAGE,
  SEO_KEYWORDS,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/seo-content";

type PageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  /** Set true for auth-only or post-checkout pages */
  noIndex?: boolean;
};

const sharedOpenGraph = {
  type: "website" as const,
  siteName: SITE_NAME,
  locale: "en_ZA" as const,
  images: [
    {
      url: OG_IMAGE.url,
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      alt: OG_IMAGE.alt,
    },
  ],
};

export function createPageMetadata(options: PageMetadataOptions = {}): Metadata {
  const title = options.title ?? DEFAULT_TITLE;
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const canonicalPath = options.path ?? "/";
  const canonical = absoluteUrl(canonicalPath);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords: [...SEO_KEYWORDS],
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "children's entertainment",
    alternates: {
      canonical,
    },
    robots: options.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      ...sharedOpenGraph,
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
    other: {
      "geo.region": "ZA",
      "geo.placename": "South Africa",
      "content-language": "en-ZA",
    },
  };
}

export const rootMetadata = createPageMetadata();
