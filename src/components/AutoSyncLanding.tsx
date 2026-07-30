import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  {
    eyebrow: "Secure access",
    title: "Secure, role-based access",
    body: "A restricted login system protects sensitive store data from unauthorized personnel. Manager-level permissions grant exclusive access to sales metrics and demo logs.",
  },
  {
    eyebrow: "Sales visibility",
    title: "Real-time sales tracking",
    body: "Daily performance logs monitor unit velocity and write clear historical daily logs. Month-to-date pacing visualizes target goals so managers can adjust strategies mid-month.",
  },
  {
    eyebrow: "Inventory control",
    title: "Unified new & used inventory",
    body: "Live lot auditing separates and monitors both new factory arrivals and pre-owned trades. Holding cost visibility flags aging stock directly on the dashboard to protect profit margins.",
  },
  {
    eyebrow: "Asset protection",
    title: "Comprehensive demo & asset tracking",
    body: "Manager demo control logs company vehicles assigned to dealership leadership. Overnight customer demos track liability, test-drive duration, and vehicle location.",
  },
] as const;

export function AutoSyncLanding({
  isSignedIn = false,
}: {
  isSignedIn?: boolean;
}) {
  const primaryHref = isSignedIn ? "/dashboard" : "/login";
  const primaryLabel = isSignedIn ? "Open dashboard" : "Login";

  return (
    <div className="min-h-screen bg-sand text-brand">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 md:px-10 md:py-5">
        <p className="font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight text-sand md:text-xl">
          AutoSync
        </p>
        <Link
          href={primaryHref}
          className="rounded-full bg-peach px-5 py-2 text-sm font-bold text-brand transition hover:bg-[#f5c9a4]"
        >
          {primaryLabel}
        </Link>
      </header>

      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2400&q=80"
          alt="Dealership vehicle lot at dusk"
          fill
          priority
          className="autosync-animate-kenburns object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand/92 via-brand/75 to-brand/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand/55 via-transparent to-brand/25" />

        <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-6 pb-16 pt-28 md:px-10 md:pb-20 lg:max-w-4xl">
          <p className="autosync-animate-fade-up font-[family-name:var(--font-syne)] text-5xl font-extrabold tracking-tight text-sand sm:text-6xl md:text-7xl lg:text-8xl">
            AutoSync
          </p>
          <h1 className="autosync-animate-fade-up autosync-delay-1 mt-4 max-w-2xl font-[family-name:var(--font-syne)] text-2xl font-bold leading-tight text-peach sm:text-3xl md:text-4xl">
            Dealership management powerhouse
          </h1>
          <p className="autosync-animate-fade-up autosync-delay-2 mt-4 max-w-xl text-base leading-relaxed text-sand/90 sm:text-lg">
            A secure, cloud-based operational hub for automotive General
            Managers and Sales Managers — inventory, sales pacing, and demos in
            one live dashboard.
          </p>
          <div className="autosync-animate-fade-up autosync-delay-3 mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-peach px-7 py-3 text-sm font-bold text-brand transition hover:bg-[#f5c9a4]"
            >
              {primaryLabel}
            </Link>
            <a
              href="#features"
              className="rounded-full border border-peach/50 px-6 py-3 text-sm font-semibold text-sand transition hover:border-peach hover:bg-peach/10"
            >
              See what it does
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-peach/40 bg-[var(--autosync-surface)] px-6 py-20 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand/70">
              What it is
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-brand md:text-4xl">
              AutoSync: dealership management powerhouse
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-[var(--autosync-muted)] md:text-lg">
            <p>
              AutoSync is a secure, cloud-based operational hub designed
              exclusively for automotive General Managers and Sales Managers. It
              streamlines asset tracking, protects your inventory investments,
              and provides real-time sales visibility to keep your dealership
              moving at peak efficiency.
            </p>
            <p>
              By replacing disjointed spreadsheets with a unified digital
              dashboard, AutoSync ensures your sales floor and vehicle lots are
              always perfectly in sync.
            </p>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-b border-peach/40 bg-sand px-6 py-20 md:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand/70">
            Key operational features
          </p>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-brand md:text-4xl">
            Everything managers need to run the floor and protect the lot
          </h2>

          <div className="mt-14 divide-y divide-peach/45 border-y border-peach/45">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="grid gap-3 py-10 md:grid-cols-[220px_1fr] md:gap-10"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand/65">
                  {feature.eyebrow}
                </p>
                <div>
                  <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold tracking-tight text-brand md:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-3xl text-base leading-relaxed text-[var(--autosync-muted)]">
                    {feature.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-peach/30 bg-brand px-6 py-20 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-peach">
            The bottom line for management
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-sand md:text-4xl">
            Eliminate the guesswork from dealership oversight
          </h2>
          <p className="mt-6 text-base leading-relaxed text-sand/80 md:text-lg">
            AutoSync gives GMs and sales managers the exact data they need for
            morning save-a-deal meetings, asset protection, and accurate monthly
            forecasting.
          </p>
        </div>
      </section>

      <section className="bg-[var(--autosync-surface)] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand/70">
            The 30-second financial pitch
          </p>
          <blockquote className="mt-6 space-y-5 border-l-4 border-peach pl-5 font-[family-name:var(--font-syne)] text-xl font-semibold leading-snug tracking-tight text-brand md:text-2xl md:leading-snug">
            <p>
              For automotive GMs and Sales Managers, unmonitored assets and slow
              lot turn directly drain the monthly financial statement.
            </p>
            <p>
              AutoSync is a secure, manager-only dashboard designed to protect
              gross profit and eliminate inventory leaks. It tracks new and used
              stock to accelerate your velocity, visualizes real-time daily and
              monthly sales pacing, and stops holding costs from eating your
              margins. Crucially, it secures your physical assets by tightly
              logging manager and overnight customer demos—slashing floor plan
              interest expenses, reducing insurance liabilities, and preventing
              unapproved mileage depreciation.
            </p>
            <p>
              Instead of losing thousands to untracked vehicle days, AutoSync
              turns lot oversight into a profit center. It ensures your
              inventory, your liabilities, and your net profit are always
              perfectly in sync.
            </p>
          </blockquote>
          <div className="mt-10">
            <Link
              href={primaryHref}
              className="inline-flex rounded-full bg-brand px-7 py-3 text-sm font-bold text-sand transition hover:bg-[#034a5c]"
            >
              {isSignedIn ? "Go to your dashboard" : "Login to AutoSync"}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-peach/40 bg-sand px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-brand">
            AutoSync
          </p>
          <p className="text-sm text-[var(--autosync-muted)]">
            Secure dealership operations for GMs and sales managers.
          </p>
        </div>
      </footer>
    </div>
  );
}
