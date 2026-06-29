"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { META_PIXEL_ID } from "@/lib/meta-pixel";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Fire PageView on client navigations (Next.js does not full-reload between routes). */
export function MetaPixelPageViews() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!META_PIXEL_ID || !pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    window.fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}

export function trackMetaPixelEvent(
  event: "Lead" | "CompleteRegistration" | "Subscribe" | "Purchase",
  params?: Record<string, unknown>
): void {
  if (!META_PIXEL_ID || typeof window === "undefined") return;
  if (params) {
    window.fbq?.("track", event, params);
  } else {
    window.fbq?.("track", event);
  }
}
