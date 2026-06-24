"use client";

import { useState } from "react";

type SiteReviewFormProps = {
  initialRating?: number;
  initialComment?: string | null;
};

export function SiteReviewForm({ initialRating, initialComment }: SiteReviewFormProps) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [comment, setComment] = useState(initialComment ?? "");
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(!!initialRating);
  const [error, setError] = useState("");

  async function submit() {
    if (rating < 1) {
      setError("Please select a star rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save review");

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-navy/5">
      <h2 className="font-medium text-navy mb-1">Review Dreamy Tales</h2>
      <p className="text-sm text-navy/60 mb-4">
        How is the service working for your family? Your feedback helps us improve stories for all
        South African parents.
      </p>

      <p className="text-xs text-navy/50 mb-2">Overall rating</p>
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={loading}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl leading-none disabled:opacity-50 transition-transform hover:scale-110"
            aria-label={`Rate ${star} stars`}
          >
            <span className={(hover || rating) >= star ? "text-gold" : "text-navy/20"}>★</span>
          </button>
        ))}
      </div>

      <label className="block text-xs text-navy/50 mb-1">Your review (optional)</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What do you love? What could be better? Story quality, delivery time, website..."
        rows={4}
        maxLength={1000}
        className="w-full text-sm border border-navy/15 rounded-xl px-3 py-2 text-navy resize-none focus:outline-none focus:ring-2 focus:ring-gold/40 mb-3"
      />

      <button
        type="button"
        onClick={submit}
        disabled={loading || rating < 1}
        className="bg-gold text-navy px-5 py-2 rounded-full text-sm font-medium disabled:opacity-40 hover:bg-gold-light transition-colors"
      >
        {loading ? "Saving..." : saved ? "Update review" : "Submit review"}
      </button>

      {saved && !error && (
        <p className="text-xs text-green-700 mt-2">Thank you — your review has been saved.</p>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      <p className="text-xs text-navy/40 mt-3">
        Reviews with 4–5 stars and comments may appear anonymously on our homepage (first name
        only).
      </p>
    </div>
  );
}
