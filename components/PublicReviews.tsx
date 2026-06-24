import { formatRatingStars } from "@/lib/reviews";
import { getPublicReviewStats } from "@/lib/reviews-public";

export async function PublicReviews() {
  const data = await getPublicReviewStats();

  if (data.totalReviews === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-white to-lavender/30 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="text-center mb-10">
          <span className="inline-block bg-rose/15 text-rose text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
            Parent love
          </span>
          <h2 className="font-display text-3xl md:text-4xl text-navy mb-2">What parents are saying</h2>
          {data.averageRating && (
            <p className="text-navy/70">
              <span className="text-gold text-xl">{formatRatingStars(Math.round(data.averageRating))}</span>
              <span className="ml-2">
                {data.averageRating} out of 5 · {data.totalReviews} review
                {data.totalReviews === 1 ? "" : "s"}
              </span>
            </p>
          )}
        </div>

        {data.testimonials.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.testimonials.map((t, i) => {
              const borders = ["border-t-coral", "border-t-sky", "border-t-purple", "border-t-mint", "border-t-gold", "border-t-rose"];
              return (
                <blockquote
                  key={i}
                  className={`bg-white rounded-2xl p-6 shadow-md border border-navy/5 border-t-4 ${borders[i % borders.length]} card-hover`}
                >
                  <p className="text-gold text-sm mb-2">{formatRatingStars(t.rating)}</p>
                  <p className="text-navy/80 text-sm leading-relaxed italic">&ldquo;{t.comment}&rdquo;</p>
                  <footer className="mt-4 text-xs text-navy/50">
                    — {t.author} · {t.context}
                  </footer>
                </blockquote>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
