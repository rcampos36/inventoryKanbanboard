import { paragraphsToHtml, sanitizeLandingHtml } from "@/lib/sanitize-html";

export type LandingFeature = {
  eyebrow: string;
  title: string;
  body: string;
};

export type LandingFeatureImage = {
  src: string;
  alt: string;
};

/** Visuals paired with the default key-features order on the landing page. */
export const DEFAULT_FEATURE_IMAGES: LandingFeatureImage[] = [
  {
    src: "/landing/feature-secure-access.webp",
    alt: "Secure dealership login and role-based access on a tablet",
  },
  {
    src: "/landing/feature-sales-tracking.webp",
    alt: "Sales tower pacing board tracking daily and month-to-date performance",
  },
  {
    src: "/landing/feature-inventory.webp",
    alt: "Manager reviewing unified new and used inventory on the lot",
  },
  {
    src: "/landing/feature-demo-tracking.webp",
    alt: "Demo vehicle leaving the showroom with overnight asset tracking",
  },
];

export function featureImageForIndex(
  index: number
): LandingFeatureImage | null {
  return DEFAULT_FEATURE_IMAGES[index] ?? null;
}

export type LandingContent = {
  heroHeadline: string;
  heroSubcopy: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutBody: string;
  featuresEyebrow: string;
  featuresTitle: string;
  features: LandingFeature[];
  bottomEyebrow: string;
  bottomTitle: string;
  bottomBody: string;
  pitchEyebrow: string;
  /** Sanitized HTML for the pitch body (headings, lists, paragraphs). */
  pitchHtml: string;
  footerTagline: string;
};

export const DEFAULT_PITCH_HTML = `
<h3>Why dealerships lose money</h3>
<ul>
  <li>Aging inventory</li>
  <li>Missed follow-up</li>
  <li>Untracked demo vehicles</li>
  <li>Poor sales visibility</li>
  <li>Manual inventory processes</li>
</ul>
<h3>SalesTower helps managers</h3>
<ul>
  <li>Protect inventory</li>
  <li>Improve accountability</li>
  <li>Monitor sales pacing</li>
  <li>Reduce floorplan costs</li>
  <li>Make decisions with live data</li>
</ul>
`.trim();

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  heroHeadline: "The Operating System for Modern Dealerships",
  heroSubcopy:
    "Know what's happening across your inventory, sales tower, and showroom—in real time.",
  aboutEyebrow: "What it is",
  aboutTitle: "Built for Sales Managers.",
  aboutBody:
    "Sales managers waste valuable time switching between systems, checking inventory boards, and asking for updates. SalesTower brings inventory, active deals, and salesperson performance into one live dashboard—giving managers the visibility they need to make faster decisions.",
  featuresEyebrow: "Key operational features",
  featuresTitle:
    "Everything managers need to run the floor and protect the lot",
  features: [
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
  ],
  bottomEyebrow: "The bottom line for management",
  bottomTitle: "Eliminate the guesswork from dealership oversight",
  bottomBody:
    "SalesTower gives GMs and sales managers the exact data they need for morning save-a-deal meetings, asset protection, and accurate monthly forecasting.",
  pitchEyebrow: "The 30-second financial pitch",
  pitchHtml: DEFAULT_PITCH_HTML,
  footerTagline: "Secure dealership operations for GMs and sales managers.",
};

export function normalizeLandingContent(
  input: Partial<LandingContent> & {
    pitchParagraphs?: string[];
  } | null | undefined
): LandingContent {
  const base = DEFAULT_LANDING_CONTENT;
  if (!input) {
    return {
      ...base,
      features: [...base.features],
      pitchHtml: base.pitchHtml,
    };
  }

  const features =
    Array.isArray(input.features) && input.features.length > 0
      ? input.features.map((feature) => ({
          eyebrow: String(feature?.eyebrow ?? "").trim() || "Feature",
          title: String(feature?.title ?? "").trim() || "Untitled",
          body: String(feature?.body ?? "").trim(),
        }))
      : [...base.features];

  let pitchHtml = String(input.pitchHtml ?? "").trim();
  if (!pitchHtml && Array.isArray(input.pitchParagraphs) && input.pitchParagraphs.length) {
    pitchHtml = paragraphsToHtml(
      input.pitchParagraphs.map((p) => String(p ?? "").trim()).filter(Boolean)
    );
  }
  if (!pitchHtml) pitchHtml = base.pitchHtml;
  pitchHtml = sanitizeLandingHtml(pitchHtml) || base.pitchHtml;

  return {
    heroHeadline: String(input.heroHeadline ?? base.heroHeadline).trim() || base.heroHeadline,
    heroSubcopy: String(input.heroSubcopy ?? base.heroSubcopy).trim() || base.heroSubcopy,
    aboutEyebrow: String(input.aboutEyebrow ?? base.aboutEyebrow).trim() || base.aboutEyebrow,
    aboutTitle: String(input.aboutTitle ?? base.aboutTitle).trim() || base.aboutTitle,
    aboutBody: String(input.aboutBody ?? base.aboutBody).trim() || base.aboutBody,
    featuresEyebrow:
      String(input.featuresEyebrow ?? base.featuresEyebrow).trim() ||
      base.featuresEyebrow,
    featuresTitle:
      String(input.featuresTitle ?? base.featuresTitle).trim() || base.featuresTitle,
    features,
    bottomEyebrow:
      String(input.bottomEyebrow ?? base.bottomEyebrow).trim() || base.bottomEyebrow,
    bottomTitle: String(input.bottomTitle ?? base.bottomTitle).trim() || base.bottomTitle,
    bottomBody: String(input.bottomBody ?? base.bottomBody).trim() || base.bottomBody,
    pitchEyebrow:
      String(input.pitchEyebrow ?? base.pitchEyebrow).trim() || base.pitchEyebrow,
    pitchHtml,
    footerTagline:
      String(input.footerTagline ?? base.footerTagline).trim() || base.footerTagline,
  };
}
