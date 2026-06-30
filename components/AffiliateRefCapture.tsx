"use client";

import { useEffect } from "react";
import { captureAffiliateRefFromUrl } from "@/lib/affiliate-client";

export function AffiliateRefCapture() {
  useEffect(() => {
    captureAffiliateRefFromUrl();
  }, []);

  return null;
}
