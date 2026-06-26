import "server-only";
import { ANALYTICS_EVENTS, type AnalyticsEventType } from "@/lib/analytics-events";
import { prisma } from "@/lib/db";

export { ANALYTICS_EVENTS, type AnalyticsEventType };

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
