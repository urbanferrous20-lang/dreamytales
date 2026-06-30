import { redirect } from "next/navigation";
import { normalizeAffiliateCode } from "@/lib/affiliate-client";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) {
    redirect("/signup");
  }
  redirect(`/signup?ref=${encodeURIComponent(normalized)}`);
}
