export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  SIGNUP_START: "signup_start",
  SIGNUP_SUBMIT: "signup_submit",
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  PAYFAST_PAYMENT_COMPLETE: "payfast_payment_complete",
} as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
