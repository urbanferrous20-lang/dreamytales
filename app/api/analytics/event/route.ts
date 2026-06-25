import { NextRequest, NextResponse } from "next/server";
import { ANALYTICS_EVENTS, logAnalyticsEventFromRequest, type AnalyticsEventType } from "@/lib/analytics";

const ALLOWED_EVENTS: AnalyticsEventType[] = [
  ANALYTICS_EVENTS.PAGE_VIEW,
  ANALYTICS_EVENTS.SIGNUP_START,
  ANALYTICS_EVENTS.SIGNUP_SUBMIT,
];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      eventType?: string;
      path?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.eventType || !ALLOWED_EVENTS.includes(body.eventType as AnalyticsEventType)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    await logAnalyticsEventFromRequest(request, {
      eventType: body.eventType as AnalyticsEventType,
      path: body.path,
      metadata: body.metadata,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}
