import { Prisma } from "@prisma/client";

export function formatSignupApiError(error: unknown): { message: string; status: number } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2022") {
      return {
        message:
          "The site database needs updating. On the server run: npm run db:push — then try again.",
        status: 503,
      };
    }
    if (error.code === "P2002") {
      return {
        message: "An account or signup with this email already exists. Try signing in instead.",
        status: 409,
      };
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("PayFast")) {
      return { message: error.message, status: 500 };
    }
    if (error.message.includes("AUTH_SECRET")) {
      return { message: "Server auth is not configured. Contact support.", status: 503 };
    }
  }

  return { message: "Signup failed. Please try again.", status: 500 };
}

export function hasActiveSubscription(status: string | null | undefined): boolean {
  return status === "trial" || status === "active" || status === "cancel_pending";
}
