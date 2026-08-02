import Image from "next/image";
import Link from "next/link";
import { boardPath } from "@/lib/paths";

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

export function SalesTowerLanding({
  isSignedIn = false,
  organizationSlug = "",
}: {
  isSignedIn?: boolean;
  organizationSlug?: string;
}) {
  const boardHref = organizationSlug ? boardPath(organizationSlug) : "/dashboard";
  const primaryHref = isSignedIn ? boardHref : "/register";
  const primaryLabel = isSignedIn ? "Open dashboard" : "Register dealership";
  const secondaryHref = isSignedIn ? boardHref : "/login";
  const secondaryLabel = isSignedIn ? "Open dashboard" : "Sign in";

  return (
    <div className="min-h-screen bg-sand text-brand">
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 border-b border-peach/25 bg-brand/95 px-6 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-[0_8px_24px_-16px_rgba(2,52,65,0.65)] backdrop-blur-md sm:gap-4 sm:px-6 sm:pb-4 sm:pt-5 md:px-10 md:pt-6">
        <p className="shrink-0 font-[family-name:var(--font-syne)] text-base font-extrabold tracking-tight text-sand sm:text-lg md:text-xl">
          SalesTower
        </p>
        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <a
            href="#features"
            className="inline-flex h-9 items-center justify-center rounded-full px-2.5 text-xs font-bold text-sand/90 transition hover:text-sand sm:h-10 sm:px-4 sm:text-sm"
          >
            Features
          </a>
          {!isSignedIn && (
            <Link
              href={secondaryHref}
              className="inline-flex h-9 items-center justify-center rounded-full px-2.5 text-xs font-bold text-sand/90 transition hover:text-sand sm:h-10 sm:px-4 sm:text-sm"
            >
              {secondaryLabel}
            </Link>
          )}
          <Link
            href={primaryHref}
            className="inline-flex h-9 items-center justify-center rounded-full bg-peach px-3.5 text-xs font-bold text-brand transition hover:bg-[#f5c9a4] sm:h-10 sm:px-5 sm:text-sm"
          >
            <span className="sm:hidden">
              {isSignedIn ? "Dashboard" : "Register"}
            </span>
            <span className="hidden sm:inline">{primaryLabel}</span>
          </Link>
        </nav>
      </header>

      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2400&q=80"
          alt="Dealership vehicle lot at dusk"
          fill
          priority
          className="salestower-animate-kenburns object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand/92 via-brand/75 to-brand/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand/55 via-transparent to-brand/25" />

        <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-6 pb-16 pt-28 md:px-10 md:pb-20 lg:max-w-4xl">
          <p className="salestower-animate-fade-up font-[family-name:var(--font-syne)] text-5xl font-extrabold tracking-tight text-sand sm:text-6xl md:text-7xl lg:text-8xl">
            SalesTower
          </p>
          <h1 className="salestower-animate-fade-up salestower-delay-1 mt-4 max-w-2xl font-[family-name:var(--font-syne)] text-2xl font-bold leading-tight text-peach sm:text-3xl md:text-4xl">
            Dealership management powerhouse
          </h1>
          <p className="salestower-animate-fade-up salestower-delay-2 mt-4 max-w-xl text-base leading-relaxed text-sand/90 sm:text-lg">
            A secure, cloud-based operational hub for automotive General
            Managers and Sales Managers — inventory, sales pacing, and demos in
            one live dashboard.
          </p>
          <div className="salestower-animate-fade-up salestower-delay-3 mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-peach px-7 py-3 text-sm font-bold text-brand transition hover:bg-[#f5c9a4]"
            >
              {primaryLabel}
            </Link>
            {!isSignedIn && (
              <Link
                href={secondaryHref}
                className="rounded-full border border-peach/50 px-6 py-3 text-sm font-semibold text-sand transition hover:border-peach hover:bg-peach/10"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-peach/40 bg-[var(--salestower-surface)] px-6 py-20 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand/70">
              What it is
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-brand md:text-4xl">
              SalesTower: dealership management powerhouse
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-[var(--salestower-muted)] md:text-lg">
            <p>
              SalesTower is a secure, cloud-based operational hub designed
              exclusively for automotive General Managers and Sales Managers. It
              streamlines asset tracking, protects your inventory investments,
              and provides real-time sales visibility to keep your dealership
              moving at peak efficiency.
            </p>
            <p>
              By replacing disjointed spreadsheets with a unified digital
              dashboard, SalesTower ensures your sales floor and vehicle lots are
              always perfectly in sync.
            </p>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-28 border-b border-peach/40 bg-sand px-6 py-20 md:px-10"
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
                  <p className="mt-3 max-w-3xl text-base leading-relaxed text-[var(--salestower-muted)]">
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
            SalesTower gives GMs and sales managers the exact data they need for
            morning save-a-deal meetings, asset protection, and accurate monthly
            forecasting.
          </p>
        </div>
      </section>

      <section className="bg-[var(--salestower-surface)] px-6 py-20 md:px-10">
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
              SalesTower is a secure, manager-only dashboard designed to protect
              gross profit and eliminate inventory leaks. It tracks new and used
              stock to accelerate your velocity, visualizes real-time daily and
              monthly sales pacing, and stops holding costs from eating your
              margins. Crucially, it secures your physical assets by tightly
              logging manager and overnight customer demos—slashing floor plan
              interest expenses, reducing insurance liabilities, and preventing
              unapproved mileage depreciation.
            </p>
            <p>
              Instead of losing thousands to untracked vehicle days, SalesTower
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
              {isSignedIn ? "Go to your dashboard" : "Register your dealership"}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-peach/40 bg-sand px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <p className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-brand">
            SalesTower
          </p>
          <p className="text-sm text-[var(--salestower-muted)]">
            Secure dealership operations for GMs and sales managers.
          </p>
        </div>
      </footer>
    </div>
  );
}
