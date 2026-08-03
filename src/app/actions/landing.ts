"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PEARSON_ORG_ID } from "@/lib/tenant";
import { boardPath } from "@/lib/paths";
import {
  DEFAULT_LANDING_CONTENT,
  normalizeLandingContent,
  type LandingContent,
  type LandingFeature,
} from "@/lib/landing-content";
import { sanitizeLandingHtml } from "@/lib/sanitize-html";

const LANDING_ID = "default";

function parseFeatures(value: unknown): LandingFeature[] {
  if (!Array.isArray(value)) return DEFAULT_LANDING_CONTENT.features;
  return value.map((item) => {
    const row = item as Partial<LandingFeature>;
    return {
      eyebrow: String(row.eyebrow ?? ""),
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
    };
  });
}

function parseParagraphs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "")).filter(Boolean);
}

function rowToContent(row: {
  heroHeadline: string;
  heroSubcopy: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutBody: string;
  featuresEyebrow: string;
  featuresTitle: string;
  featuresJson: unknown;
  bottomEyebrow: string;
  bottomTitle: string;
  bottomBody: string;
  pitchEyebrow: string;
  pitchHtml?: string | null;
  pitchParagraphsJson: unknown;
  footerTagline: string;
}): LandingContent {
  return normalizeLandingContent({
    heroHeadline: row.heroHeadline,
    heroSubcopy: row.heroSubcopy,
    aboutEyebrow: row.aboutEyebrow,
    aboutTitle: row.aboutTitle,
    aboutBody: row.aboutBody,
    featuresEyebrow: row.featuresEyebrow,
    featuresTitle: row.featuresTitle,
    features: parseFeatures(row.featuresJson),
    bottomEyebrow: row.bottomEyebrow,
    bottomTitle: row.bottomTitle,
    bottomBody: row.bottomBody,
    pitchEyebrow: row.pitchEyebrow,
    pitchHtml: row.pitchHtml ?? "",
    pitchParagraphs: parseParagraphs(row.pitchParagraphsJson),
    footerTagline: row.footerTagline,
  });
}

/** Platform admin only (Pearson) — marketing site is global. */
async function requirePlatformAdmin() {
  const user = await requireAdmin();
  if (user.organizationId !== PEARSON_ORG_ID) {
    redirect(boardPath(user.organizationSlug));
  }
  return user;
}

export async function getLandingContent(): Promise<LandingContent> {
  try {
    const existing = await prisma.landingPageContent.findUnique({
      where: { id: LANDING_ID },
    });
    if (existing) return rowToContent(existing);

    const created = await prisma.landingPageContent.create({
      data: {
        id: LANDING_ID,
        heroHeadline: DEFAULT_LANDING_CONTENT.heroHeadline,
        heroSubcopy: DEFAULT_LANDING_CONTENT.heroSubcopy,
        aboutEyebrow: DEFAULT_LANDING_CONTENT.aboutEyebrow,
        aboutTitle: DEFAULT_LANDING_CONTENT.aboutTitle,
        aboutBody: DEFAULT_LANDING_CONTENT.aboutBody,
        featuresEyebrow: DEFAULT_LANDING_CONTENT.featuresEyebrow,
        featuresTitle: DEFAULT_LANDING_CONTENT.featuresTitle,
        featuresJson: DEFAULT_LANDING_CONTENT.features,
        bottomEyebrow: DEFAULT_LANDING_CONTENT.bottomEyebrow,
        bottomTitle: DEFAULT_LANDING_CONTENT.bottomTitle,
        bottomBody: DEFAULT_LANDING_CONTENT.bottomBody,
        pitchEyebrow: DEFAULT_LANDING_CONTENT.pitchEyebrow,
        pitchHtml: DEFAULT_LANDING_CONTENT.pitchHtml,
        pitchParagraphsJson: [],
        footerTagline: DEFAULT_LANDING_CONTENT.footerTagline,
      },
    });
    return rowToContent(created);
  } catch {
    // DB unavailable or migration not applied yet — serve defaults.
    return normalizeLandingContent(null);
  }
}

export type SaveLandingContentState = {
  ok: boolean;
  error?: string;
  content?: LandingContent;
};

export async function saveLandingContentAction(
  _prev: SaveLandingContentState,
  formData: FormData
): Promise<SaveLandingContentState> {
  await requirePlatformAdmin();

  const featureCount = Number(formData.get("featureCount") ?? 0);
  const features: LandingFeature[] = [];
  for (let i = 0; i < featureCount; i++) {
    features.push({
      eyebrow: String(formData.get(`featureEyebrow_${i}`) ?? ""),
      title: String(formData.get(`featureTitle_${i}`) ?? ""),
      body: String(formData.get(`featureBody_${i}`) ?? ""),
    });
  }

  const pitchHtml = sanitizeLandingHtml(String(formData.get("pitchHtml") ?? ""));

  const content = normalizeLandingContent({
    heroHeadline: String(formData.get("heroHeadline") ?? ""),
    heroSubcopy: String(formData.get("heroSubcopy") ?? ""),
    aboutEyebrow: String(formData.get("aboutEyebrow") ?? ""),
    aboutTitle: String(formData.get("aboutTitle") ?? ""),
    aboutBody: String(formData.get("aboutBody") ?? ""),
    featuresEyebrow: String(formData.get("featuresEyebrow") ?? ""),
    featuresTitle: String(formData.get("featuresTitle") ?? ""),
    features,
    bottomEyebrow: String(formData.get("bottomEyebrow") ?? ""),
    bottomTitle: String(formData.get("bottomTitle") ?? ""),
    bottomBody: String(formData.get("bottomBody") ?? ""),
    pitchEyebrow: String(formData.get("pitchEyebrow") ?? ""),
    pitchHtml,
    footerTagline: String(formData.get("footerTagline") ?? ""),
  });

  try {
    await prisma.landingPageContent.upsert({
      where: { id: LANDING_ID },
      create: {
        id: LANDING_ID,
        heroHeadline: content.heroHeadline,
        heroSubcopy: content.heroSubcopy,
        aboutEyebrow: content.aboutEyebrow,
        aboutTitle: content.aboutTitle,
        aboutBody: content.aboutBody,
        featuresEyebrow: content.featuresEyebrow,
        featuresTitle: content.featuresTitle,
        featuresJson: content.features,
        bottomEyebrow: content.bottomEyebrow,
        bottomTitle: content.bottomTitle,
        bottomBody: content.bottomBody,
        pitchEyebrow: content.pitchEyebrow,
        pitchHtml: content.pitchHtml,
        pitchParagraphsJson: [],
        footerTagline: content.footerTagline,
      },
      update: {
        heroHeadline: content.heroHeadline,
        heroSubcopy: content.heroSubcopy,
        aboutEyebrow: content.aboutEyebrow,
        aboutTitle: content.aboutTitle,
        aboutBody: content.aboutBody,
        featuresEyebrow: content.featuresEyebrow,
        featuresTitle: content.featuresTitle,
        featuresJson: content.features,
        bottomEyebrow: content.bottomEyebrow,
        bottomTitle: content.bottomTitle,
        bottomBody: content.bottomBody,
        pitchEyebrow: content.pitchEyebrow,
        pitchHtml: content.pitchHtml,
        footerTagline: content.footerTagline,
      },
    });
  } catch (error) {
    console.error("Failed to save landing content", error);
    return {
      ok: false,
      error: "Could not save. Check that the database migration has been applied.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/landing");
  return { ok: true, content };
}
