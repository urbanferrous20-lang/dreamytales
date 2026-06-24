"use client";

import { useState } from "react";

type StoryReviewFormProps = {
  storyId: string;
  storyTitle: string;
  initialRating?: number;
  initialComment?: string | null;
};

export function StoryReviewForm({
  storyId,
  storyTitle,
  initialRating,
  initialComment,
}: StoryReviewFormProps) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [comment, setComment] = useState(initialComment ?? "");
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(!!initialRating);
  const [error, setError] = useState("");

  async function submit(nextRating?: number) {
    const value = nextRating ?? rating;
    if (value < 1) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          rating: value,
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save review");

      setRating(value);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-navy/10">
      <p className="text-xs text-navy/50 mb-2">Rate this story</p>
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={loading}
            onClick={() => {
              setRating(star);
              submit(star);
            }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-xl leading-none disabled:opacity-50 transition-transform hover:scale-110"
            aria-label={`Rate ${star} stars`}
          >
            <span className={(hover || rating) >= star ? "text-gold" : "text-navy/20"}>★</span>
          </button>
        ))}
        {saved && <span className="text-xs text-green-700 ml-2">Saved</span>}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={`Optional: what did ${storyTitle.split(" ")[0] || "your child"} think?`}
        rows={2}
        maxLength={500}
        className="w-full text-sm border border-navy/15 rounded-xl px-3 py-2 text-navy resize-none focus:outline-none focus:ring-2 focus:ring-gold/40"
      />
      <button
        type="button"
        onClick={() => submit()}
        disabled={loading || rating < 1}
        className="mt-2 text-xs bg-navy text-cream px-3 py-1.5 rounded-full disabled:opacity-40 hover:bg-navy-light transition-colors"
      >
        {loading ? "Saving..." : saved ? "Update review" : "Submit review"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
