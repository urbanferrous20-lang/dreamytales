import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo-content";
import { SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description:
      "Personalised illustrated bedtime short stories delivered nightly to South African families.",
    start_url: "/",
    display: "standalone",
    background_color: "#1f2949",
    theme_color: "#1f2949",
    lang: "en-ZA",
    categories: ["books", "kids", "education"],
    icons: [
      {
        src: "/samples/story-page-1.png",
        sizes: "1024x1365",
        type: "image/png",
      },
    ],
  };
}
