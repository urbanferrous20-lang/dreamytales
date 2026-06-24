"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelForm({ accessEndsAt }: { accessEndsAt: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const endDate = new Date(accessEndsAt).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleCancel() {
    if (!confirm(`Cancel subscription? Stories continue until ${endDate}.`)) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cancellation failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">{error}</div>
      )}
      <button
        onClick={handleCancel}
        disabled={loading}
        className="w-full bg-red-600 text-white py-3 rounded-full font-medium hover:bg-red-700 disabled:opacity-40 transition-colors"
      >
        {loading ? "Processing..." : "Confirm cancellation"}
      </button>
    </div>
  );
}
