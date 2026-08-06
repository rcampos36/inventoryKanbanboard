import Image from "next/image";
import Link from "next/link";
import { boardPath } from "@/lib/paths";
import {
  featureImageForIndex,
  type LandingContent,
} from "@/lib/landing-content";
import { LandingRichHtml } from "@/components/LandingRichHtml";
import { ContactUsButton } from "@/components/ContactUs";
import { ScheduleDemoButton } from "@/components/ScheduleDemo";

export function SalesTowerLanding({
  content,
  isSignedIn = false,
  organizationSlug = "",
}: {
  content: LandingContent;
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
          <ScheduleDemoButton className="inline-flex h-9 items-center justify-center rounded-full border border-peach/45 px-2.5 text-xs font-bold text-sand transition hover:border-peach hover:bg-peach/10 sm:h-10 sm:px-4 sm:text-sm">
            <span className="sm:hidden">Demo</span>
            <span className="hidden sm:inline">Schedule a Demo</span>
          </ScheduleDemoButton>
          <ContactUsButton className="inline-flex h-9 items-center justify-center rounded-full border border-peach/45 px-2.5 text-xs font-bold text-sand transition hover:border-peach hover:bg-peach/10 sm:h-10 sm:px-4 sm:text-sm">
            <span className="sm:hidden">Contact</span>
            <span className="hidden sm:inline">Contact Us</span>
          </ContactUsButton>
          <Link
            href="/admin/landing"
            className="inline-flex h-9 items-center justify-center rounded-full px-2.5 text-xs font-bold text-sand/90 transition hover:text-sand sm:h-10 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">Edit</span>
            <span className="hidden sm:inline">Edit copy</span>
          </Link>
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
            {content.heroHeadline}
          </h1>
          <p className="salestower-animate-fade-up salestower-delay-2 mt-4 max-w-xl text-base leading-relaxed text-sand/90 sm:text-lg">
            {content.heroSubcopy}
          </p>
          <div className="salestower-animate-fade-up salestower-delay-3 mt-8 flex flex-wrap items-center gap-3">
            <ScheduleDemoButton className="rounded-full bg-peach px-7 py-3 text-sm font-bold text-brand transition hover:bg-[#f5c9a4]">
              Schedule a Demo
            </ScheduleDemoButton>
            <Link
              href={primaryHref}
              className="rounded-full border border-peach/50 px-6 py-3 text-sm font-semibold text-sand transition hover:border-peach hover:bg-peach/10"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-peach/40 bg-[var(--salestower-surface)] px-6 py-20 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand/70">
              {content.aboutEyebrow}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-brand md:text-4xl">
              {content.aboutTitle}
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-[var(--salestower-muted)] md:text-lg">
            <p>{content.aboutBody}</p>
            <ScheduleDemoButton className="inline-flex rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-sand transition hover:bg-[#034a5c]">
              Schedule a Demo
            </ScheduleDemoButton>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-28 border-b border-peach/40 bg-sand px-6 py-20 md:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand/70">
            {content.featuresEyebrow}
          </p>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-brand md:text-4xl">
            {content.featuresTitle}
          </h2>

          <div className="mt-14 flex flex-col gap-16 md:gap-20">
            {content.features.map((feature, index) => {
              const image = featureImageForIndex(index);
              const imageLeft = index % 2 === 0;

              return (
                <article
                  key={`${feature.eyebrow}-${feature.title}`}
                  className={[
                    "grid items-center gap-8 lg:grid-cols-2 lg:gap-14",
                    imageLeft ? "" : "lg:[&>*:first-child]:order-2",
                  ].join(" ")}
                >
                  {image ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-brand/10">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover transition duration-700 ease-out hover:scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 560px"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand/25 via-transparent to-transparent" />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gradient-to-br from-brand via-brand to-[#045066]" />
                  )}

                  <div className={imageLeft ? "lg:pl-2" : "lg:pr-2"}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand/65">
                      {feature.eyebrow}
                    </p>
                    <h3 className="mt-3 font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-brand md:text-3xl">
                      {feature.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--salestower-muted)] md:text-lg">
                      {feature.body}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-peach/30 bg-brand px-6 py-20 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-peach">
            {content.bottomEyebrow}
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-sand md:text-4xl">
            {content.bottomTitle}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-sand/80 md:text-lg">
            {content.bottomBody}
          </p>
          <div className="mt-8">
            <ScheduleDemoButton className="rounded-full bg-peach px-7 py-3 text-sm font-bold text-brand transition hover:bg-[#f5c9a4]">
              Schedule a Demo
            </ScheduleDemoButton>
          </div>
        </div>
      </section>

      <section className="bg-[var(--salestower-surface)] px-6 py-20 md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand/70">
            {content.pitchEyebrow}
          </p>
          <div className="mt-6 border-l-4 border-peach pl-5">
            <LandingRichHtml html={content.pitchHtml} />
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ScheduleDemoButton className="inline-flex rounded-full bg-brand px-7 py-3 text-sm font-bold text-sand transition hover:bg-[#034a5c]">
              Schedule a Demo
            </ScheduleDemoButton>
            <Link
              href={primaryHref}
              className="inline-flex rounded-full border border-brand/20 px-6 py-3 text-sm font-semibold text-brand transition hover:bg-peach/30"
            >
              {isSignedIn ? "Go to your dashboard" : "Register your dealership"}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-peach/40 bg-sand px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-brand">
              SalesTower
            </p>
            <p className="mt-1 text-sm text-[var(--salestower-muted)]">
              {content.footerTagline}
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link
                href="/terms"
                className="font-semibold text-brand/70 underline decoration-peach/70 underline-offset-2 hover:text-brand"
              >
                Terms of Use
              </Link>
              <Link
                href="/platform"
                className="font-semibold text-brand/70 underline decoration-peach/70 underline-offset-2 hover:text-brand"
              >
                Backend
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ContactUsButton className="rounded-full border border-brand/25 bg-[var(--salestower-surface)] px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-peach/40">
              Contact Us
            </ContactUsButton>
            <ScheduleDemoButton className="rounded-full border border-brand/25 bg-[var(--salestower-surface)] px-5 py-2.5 text-sm font-bold text-brand transition hover:bg-peach/40">
              Schedule a Demo
            </ScheduleDemoButton>
          </div>
        </div>
      </footer>
    </div>
  );
}
