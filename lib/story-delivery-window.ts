const SAST_TIMEZONE = "Africa/Johannesburg";

/** Default: no story emails before 16:00 (4pm) SAST. */
export const DEFAULT_STORY_DELIVERY_START_HOUR_SAST = 16;

export type StoryDeliveryWindow = {
  startHour: number;
  endHour: number | null;
  timezone: string;
};

export function getStoryDeliveryWindow(): StoryDeliveryWindow {
  const startRaw = process.env.STORY_DELIVERY_START_HOUR_SAST?.trim();
  const endRaw = process.env.STORY_DELIVERY_END_HOUR_SAST?.trim();

  let startHour = DEFAULT_STORY_DELIVERY_START_HOUR_SAST;
  if (startRaw) {
    const parsed = Number.parseInt(startRaw, 10);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 23) {
      startHour = parsed;
    }
  }

  let endHour: number | null = null;
  if (endRaw) {
    const parsed = Number.parseInt(endRaw, 10);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 23) {
      endHour = parsed;
    }
  }

  return { startHour, endHour, timezone: SAST_TIMEZONE };
}

/** Current date/time components in South African Standard Time. */
export function getSastDateParts(asOf = new Date()): {
  hour: number;
  minute: number;
  label: string;
} {
  const sast = new Date(asOf.toLocaleString("en-US", { timeZone: SAST_TIMEZONE }));
  const hour = sast.getHours();
  const minute = sast.getMinutes();
  const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} SAST`;
  return { hour, minute, label };
}

export function formatDeliveryWindowLabel(window: StoryDeliveryWindow): string {
  const start = `${String(window.startHour).padStart(2, "0")}:00`;
  if (window.endHour == null) {
    return `${start}–23:59 SAST`;
  }
  const end = `${String(window.endHour).padStart(2, "0")}:59`;
  return `${start}–${end} SAST`;
}

export function isWithinStoryDeliveryWindow(asOf = new Date()): boolean {
  if (process.env.STORY_DELIVERY_ENFORCE === "false") return true;

  const { startHour, endHour } = getStoryDeliveryWindow();
  const { hour } = getSastDateParts(asOf);

  if (hour < startHour) return false;
  if (endHour != null && hour > endHour) return false;
  return true;
}

export function getStoryDeliveryWindowBlockReason(asOf = new Date()): {
  blocked: boolean;
  nowSast: string;
  deliveryWindow: string;
  message: string;
} {
  const window = getStoryDeliveryWindow();
  const { label: nowSast } = getSastDateParts(asOf);
  const deliveryWindow = formatDeliveryWindowLabel(window);
  const blocked = !isWithinStoryDeliveryWindow(asOf);

  return {
    blocked,
    nowSast,
    deliveryWindow,
    message: blocked
      ? `Story emails are only sent during ${deliveryWindow}. Current time: ${nowSast}.`
      : `Within delivery window (${deliveryWindow}). Current time: ${nowSast}.`,
  };
}
