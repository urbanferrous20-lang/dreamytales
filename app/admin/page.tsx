import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminDashboardStats, formatRevenue } from "@/lib/admin-stats";
import { formatBytes } from "@/lib/storage-stats";

function MetricCard({
  title,
  today,
  month,
  total,
  suffix,
}: {
  title: string;
  today?: number | string;
  month?: number | string;
  total?: number | string;
  suffix?: string;
}) {
  const fmt = (v: number | string | undefined) =>
    v === undefined ? "—" : typeof v === "number" ? `${v}${suffix ?? ""}` : v;

  return (
    <div className="bg-white rounded-2xl p-5 border border-navy/5 shadow-sm">
      <h3 className="text-sm font-medium text-navy/60 mb-3">{title}</h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-navy/40 mb-1">Today</p>
          <p className="text-xl font-semibold text-navy">{fmt(today)}</p>
        </div>
        <div>
          <p className="text-xs text-navy/40 mb-1">Month</p>
          <p className="text-xl font-semibold text-navy">{fmt(month)}</p>
        </div>
        <div>
          <p className="text-xs text-navy/40 mb-1">Total</p>
          <p className="text-xl font-semibold text-navy">{fmt(total)}</p>
        </div>
      </div>
    </div>
  );
}

function RevenueCard({
  title,
  yesterday,
  month,
  total,
}: {
  title: string;
  yesterday: number;
  month: number;
  total: number;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-navy/5 shadow-sm">
      <h3 className="text-sm font-medium text-navy/60 mb-3">{title}</h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-navy/40 mb-1">Yesterday</p>
          <p className="text-xl font-semibold text-navy">{formatRevenue(yesterday)}</p>
        </div>
        <div>
          <p className="text-xs text-navy/40 mb-1">Month</p>
          <p className="text-xl font-semibold text-navy">{formatRevenue(month)}</p>
        </div>
        <div>
          <p className="text-xs text-navy/40 mb-1">Total</p>
          <p className="text-xl font-semibold text-navy">{formatRevenue(total)}</p>
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  let stats: Awaited<ReturnType<typeof getAdminDashboardStats>> | null = null;
  let dbError: string | null = null;

  try {
    stats = await getAdminDashboardStats();
  } catch (error) {
    dbError =
      error instanceof Error
        ? error.message
        : "Could not load dashboard data. Check DATABASE_URL and run npm run db:push.";
  }

  if (dbError || !stats) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-cream rounded-2xl p-8 text-navy">
          <h1 className="font-display text-2xl mb-2">Signed in as admin</h1>
          <p className="text-navy/70 mb-4">
            Login worked, but the dashboard could not load stats from the database.
          </p>
          <p className="text-sm text-coral bg-coral/10 rounded-lg p-3">{dbError}</p>
          <p className="text-sm text-navy/60 mt-4">
            Local dev needs a MySQL <code className="text-xs">DATABASE_URL</code> (the app no longer
            uses SQLite). On Plesk, use your <code className="text-xs">dreamyta_</code> database and
            run <code className="text-xs">npx prisma db push</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-cream">Admin Dashboard</h1>
          <p className="text-cream/60 mt-1">Dreamy Tales site overview</p>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-cream/70 hover:text-cream border border-cream/20 px-4 py-2 rounded-full"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gold/20 rounded-2xl p-4 border border-gold/30">
          <p className="text-xs text-cream/60">Active subscribers</p>
          <p className="text-2xl font-semibold text-cream">{stats.activeSubscribers}</p>
          <p className="text-xs text-cream/50 mt-1">{stats.trialSubscribers} on trial</p>
        </div>
        <div className="bg-gold/20 rounded-2xl p-4 border border-gold/30">
          <p className="text-xs text-cream/60">Stories sent today</p>
          <p className="text-2xl font-semibold text-cream">{stats.storiesSentToday}</p>
        </div>
        <div className="bg-gold/20 rounded-2xl p-4 border border-gold/30">
          <p className="text-xs text-cream/60">Checkout in progress</p>
          <p className="text-2xl font-semibold text-cream">{stats.abandonedCheckouts.active}</p>
          <p className="text-xs text-cream/50 mt-1">Pending PayFast completion</p>
        </div>
        <div className="bg-gold/20 rounded-2xl p-4 border border-gold/30">
          <p className="text-xs text-cream/60">Signup conversion</p>
          <p className="text-2xl font-semibold text-cream">{stats.conversionRate}%</p>
          <p className="text-xs text-cream/50 mt-1">Started → activated</p>
        </div>
      </div>

      {(stats.accountsMissingSubscription > 0 ||
        (stats.signupSubmits.total > 0 && stats.activeSubscribers === 0)) && (
        <div className="mb-8 rounded-2xl border border-amber-300/40 bg-amber-100/10 p-5 text-cream">
          <p className="font-medium text-amber-100">Activation may be incomplete</p>
          <p className="text-sm text-cream/70 mt-2">
            {stats.totalAccounts} parent account(s) in the database, but only {stats.activeSubscribers}{" "}
            active subscription(s).
            {stats.accountsMissingSubscription > 0
              ? ` ${stats.accountsMissingSubscription} account(s) have no subscription row.`
              : ""}
            {stats.payfastCheckouts.total > 0
              ? ` PayFast reported ${stats.payfastCheckouts.total} completed checkout(s).`
              : ""}
          </p>
          <p className="text-xs text-cream/50 mt-2">
            On Plesk run{" "}
            <code className="text-cream/80">npm run repair:activations</code> after deploy, then check
            PayFast ITN logs and <code className="text-cream/80">/api/health</code>.
          </p>
        </div>
      )}

      <section className="bg-white rounded-2xl border border-navy/5 shadow-sm p-6 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-xl text-navy">Storage & retention</h2>
            <p className="text-sm text-navy/50 mt-1">
              PDFs on disk · {stats.storage.retentionDays}-day retention (older files deleted automatically)
            </p>
          </div>
          {stats.storage.pendingCleanupCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              {stats.storage.pendingCleanupCount} PDF(s) due for cleanup
            </span>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-navy/60 mb-1">
            <span>Estimated disk use ({stats.storage.quotaGb} GB plan)</span>
            <span>{stats.storage.percentUsed}%</span>
          </div>
          <div className="h-3 bg-navy/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all"
              style={{ width: `${Math.min(100, stats.storage.percentUsed)}%` }}
            />
          </div>
          <p className="text-xs text-navy/40 mt-1">
            ~{formatBytes(stats.storage.estimatedUsedBytes)} used · ~{formatBytes(stats.storage.estimatedFreeBytes)} free
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-cream/80 p-4">
            <p className="text-xs text-navy/50">Story PDFs on disk</p>
            <p className="text-lg font-semibold text-navy">{formatBytes(stats.storage.pdfBytes)}</p>
            <p className="text-xs text-navy/40 mt-1">{stats.storage.pdfFileCount} files</p>
          </div>
          <div className="rounded-xl bg-cream/80 p-4">
            <p className="text-xs text-navy/50">Illustration cache</p>
            <p className="text-lg font-semibold text-navy">{formatBytes(stats.storage.imageBytes)}</p>
            <p className="text-xs text-navy/40 mt-1">Overwritten nightly per child</p>
          </div>
          <div className="rounded-xl bg-cream/80 p-4">
            <p className="text-xs text-navy/50">Est. daily growth</p>
            <p className="text-lg font-semibold text-navy">
              {formatBytes(stats.storage.estimatedDailyGrowthBytes)}
            </p>
            <p className="text-xs text-navy/40 mt-1">
              {stats.storage.activeChildren} active {stats.storage.activeChildren === 1 ? "child" : "children"} × ~
              {formatBytes(stats.storage.avgPdfBytes)}/story
            </p>
          </div>
          <div className="rounded-xl bg-cream/80 p-4">
            <p className="text-xs text-navy/50">Est. monthly growth</p>
            <p className="text-lg font-semibold text-navy">
              {formatBytes(stats.storage.estimatedMonthlyGrowthBytes)}
            </p>
            <p className="text-xs text-navy/40 mt-1">
              {stats.storage.estimatedDaysUntilFull != null
                ? `~${stats.storage.estimatedDaysUntilFull} days until full at current pace`
                : "Add subscribers to see runway estimate"}
            </p>
          </div>
        </div>

        <p className="text-xs text-navy/40 mt-4">
          {stats.storage.archivedStoryCount} archived {stats.storage.archivedStoryCount === 1 ? "story" : "stories"}{" "}
          (PDF removed after {stats.storage.retentionDays} days; parents keep email copies). App/build overhead
          estimated at ~{formatBytes(stats.storage.estimatedAppOverheadBytes)}.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <MetricCard
          title="Site visitors (unique sessions)"
          today={stats.visitors.today}
          month={stats.visitors.monthToDate}
          total={stats.visitors.total}
        />
        <MetricCard
          title="Started signup (/signup opened)"
          today={stats.signupStarts.today}
          month={stats.signupStarts.monthToDate}
          total={stats.signupStarts.total}
        />
        <MetricCard
          title="Began subscription (form submitted → PayFast)"
          today={stats.signupSubmits.today}
          month={stats.signupSubmits.monthToDate}
          total={stats.signupSubmits.total}
        />
        <MetricCard
          title="Abandoned checkout (did not complete PayFast)"
          today={stats.abandonedCheckouts.today}
          month={stats.abandonedCheckouts.monthToDate}
          total={stats.abandonedCheckouts.total}
        />
        <MetricCard
          title="New subscriptions"
          today={stats.subscriptions.today}
          month={stats.subscriptions.monthToDate}
          total={stats.subscriptions.total}
        />
        <MetricCard
          title="PayFast payments recorded"
          today={stats.payfastPayments.today}
          month={stats.payfastPayments.monthToDate}
          total={stats.payfastPayments.total}
        />
        <MetricCard
          title="PayFast checkouts completed (ITN)"
          today={stats.payfastCheckouts.today}
          month={stats.payfastCheckouts.monthToDate}
          total={stats.payfastCheckouts.total}
        />
        <div className="bg-white rounded-2xl p-5 border border-navy/5 shadow-sm">
          <h3 className="text-sm font-medium text-navy/60 mb-3">Parent accounts</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-navy/40 mb-1">Registered</p>
              <p className="text-xl font-semibold text-navy">{stats.totalAccounts}</p>
            </div>
            <div>
              <p className="text-xs text-navy/40 mb-1">Missing subscription</p>
              <p className="text-xl font-semibold text-navy">{stats.accountsMissingSubscription}</p>
            </div>
          </div>
        </div>
        <RevenueCard
          title="Revenue (paid)"
          yesterday={stats.revenue.yesterday}
          month={stats.revenue.monthToDate}
          total={stats.revenue.total}
        />
        <MetricCard
          title="Unsubscribes"
          today={stats.unsubscribes.today}
          month={stats.unsubscribes.monthToDate}
          total={stats.unsubscribes.total}
        />
      </div>

      <section className="bg-white rounded-2xl border border-navy/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-navy/5">
          <h2 className="font-display text-xl text-navy">Recent reviews</h2>
          <p className="text-sm text-navy/50 mt-1">Site and story feedback from parents</p>
        </div>

        {stats.reviews.length === 0 ? (
          <p className="px-6 py-8 text-navy/50 text-sm">No reviews yet.</p>
        ) : (
          <div className="divide-y divide-navy/5">
            {stats.reviews.slice(0, 30).map((review) => (
              <div key={`${review.type}-${review.id}`} className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-gold">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                  <span className="text-xs uppercase tracking-wide text-navy/40 bg-navy/5 px-2 py-0.5 rounded">
                    {review.type === "site" ? "Site review" : "Story review"}
                  </span>
                  <span className="text-xs text-navy/40">
                    {review.createdAt.toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-sm font-medium text-navy">
                  {review.parentName}{" "}
                  <span className="font-normal text-navy/50">({review.parentEmail})</span>
                </p>
                {review.storyTitle && (
                  <p className="text-sm text-navy/60 mt-1">
                    Story: {review.storyTitle}
                    {review.childName ? ` · ${review.childName}` : ""}
                  </p>
                )}
                {review.comment ? (
                  <p className="text-sm text-navy/80 mt-2">{review.comment}</p>
                ) : (
                  <p className="text-sm text-navy/40 mt-2 italic">No written comment</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
