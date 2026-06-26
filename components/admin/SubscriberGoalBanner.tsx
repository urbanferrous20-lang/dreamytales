import {
  formatSubscriberCount,
  type SubscriberGoalProgress,
} from "@/lib/subscriber-goal";

type SubscriberGoalBannerProps = {
  progress: SubscriberGoalProgress;
  trialSubscribers: number;
};

export function SubscriberGoalBanner({ progress, trialSubscribers }: SubscriberGoalBannerProps) {
  const activePaid = Math.max(0, progress.current - trialSubscribers);

  return (
    <section
      className="mb-8 relative overflow-hidden rounded-3xl border-2 border-gold/50 shadow-xl shadow-gold/10"
      aria-label="Subscriber goal progress"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold via-sunset to-coral opacity-95" />
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-4 right-8 text-4xl opacity-30 animate-pulse">✨</span>
        <span className="absolute bottom-6 left-6 text-3xl opacity-25">🌙</span>
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/20 blur-3xl" />
      </div>

      <div className="relative px-6 py-8 md:px-10 md:py-10 text-navy">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-navy/60 mb-2">
              Subscription goal
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">
              {progress.reached
                ? "Goal reached!"
                : `Road to ${formatSubscriberCount(progress.goal)} subscribers`}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-navy/60 uppercase tracking-wide">Target</p>
            <p className="font-display text-3xl md:text-4xl font-bold tabular-nums">
              {formatSubscriberCount(progress.goal)}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            {progress.reached ? (
              <p className="font-display text-5xl md:text-6xl font-bold tabular-nums mb-2">
                {formatSubscriberCount(progress.current)}
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-navy/70 uppercase tracking-wide mb-1">
                  Subscribers to go
                </p>
                <p className="font-display text-5xl md:text-7xl font-bold tabular-nums leading-none mb-3">
                  {formatSubscriberCount(progress.remaining)}
                </p>
              </>
            )}
            <p className="text-sm text-navy/75">
              <strong className="text-navy tabular-nums">
                {formatSubscriberCount(progress.current)}
              </strong>{" "}
              of{" "}
              <strong className="text-navy tabular-nums">
                {formatSubscriberCount(progress.goal)}
              </strong>{" "}
              active subscribers
              {!progress.reached && (
                <span className="text-navy/60">
                  {" "}
                  · {progress.progressPct < 0.01 ? "<0.01" : progress.progressPct.toFixed(2)}% there
                </span>
              )}
            </p>
            <p className="text-xs text-navy/55 mt-2">
              {formatSubscriberCount(trialSubscribers)} on trial ·{" "}
              {formatSubscriberCount(activePaid)} active (post-trial)
            </p>
          </div>

          <div className="min-w-[140px] text-center md:text-right">
            <div className="inline-flex flex-col items-center md:items-end">
              <span className="text-4xl md:text-5xl font-display font-bold tabular-nums">
                {progress.progressPct >= 100
                  ? "100"
                  : progress.progressPct < 0.01
                    ? "<0.01"
                    : progress.progressPct.toFixed(1)}
                %
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-navy/60">
                Complete
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 h-4 rounded-full bg-navy/15 overflow-hidden ring-1 ring-navy/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-navy via-navy-light to-purple transition-all duration-700 min-w-[2px]"
            style={{ width: `${Math.max(progress.reached ? 100 : progress.progressPct, progress.current > 0 ? 0.5 : 0)}%` }}
            role="progressbar"
            aria-valuenow={progress.current}
            aria-valuemin={0}
            aria-valuemax={progress.goal}
            aria-label={`${formatSubscriberCount(progress.current)} of ${formatSubscriberCount(progress.goal)} subscribers`}
          />
        </div>
      </div>
    </section>
  );
}
