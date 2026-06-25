"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_COOKIE = "dt_vid";
const SESSION_KEY = "dt_session";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  let visitorId = localStorage.getItem(VISITOR_COOKIE);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_COOKIE, visitorId);
  }

  return `${visitorId}:${sessionId}`;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    void fetch("/api/analytics/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Analytics-Session": sessionId,
      },
      body: JSON.stringify({ eventType: "page_view", path: pathname }),
      keepalive: true,
    });
  }, [pathname]);

  return null;
}

export function trackAnalyticsEvent(
  eventType: "signup_start" | "signup_submit",
  metadata?: Record<string, unknown>
): void {
  const sessionId = getOrCreateSessionId();
  if (!sessionId) return;

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Analytics-Session": sessionId,
    },
    body: JSON.stringify({
      eventType,
      path: window.location.pathname,
      metadata,
    }),
    keepalive: true,
  });
}
