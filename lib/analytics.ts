import "server-only";
import { prisma } from "@/lib/db";

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  SIGNUP_START: "signup_start",
  SIGNUP_SUBMIT: "signup_submit",
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  PAYFAST_PAYMENT_COMPLETE: "payfast_payment_complete",
} as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export async function logAnalyticsEvent(params: {
  eventType: AnalyticsEventType;
  sessionId: string;
  path?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: params.eventType,
        sessionId: params.sessionId,
        path: params.path ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch {
    // Analytics must not break user flows
  }
}

export async function logAnalyticsEventFromRequest(
  request: Request,
  params: Omit<Parameters<typeof logAnalyticsEvent>[0], "sessionId"> & { sessionId?: string }
): Promise<void> {
  const sessionId =
    params.sessionId ??
    request.headers.get("x-analytics-session") ??
    request.headers.get("x-forwarded-for") ??
    "unknown";

  await logAnalyticsEvent({ ...params, sessionId });
}
