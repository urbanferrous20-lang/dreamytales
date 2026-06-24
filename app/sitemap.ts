import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo-content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/signup"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/login"), lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/terms"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/llms.txt"), lastModified, changeFrequency: "monthly", priority: 0.2 },
    { url: absoluteUrl("/llms-full.txt"), lastModified, changeFrequency: "monthly", priority: 0.2 },
  ];
}
