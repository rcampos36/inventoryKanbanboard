"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import Link from "next/link";
import {
  saveLandingContentAction,
  type SaveLandingContentState,
} from "@/app/actions/landing";
import type { LandingContent, LandingFeature } from "@/lib/landing-content";
import { LandingRichHtml } from "@/components/LandingRichHtml";

const RichTextEditor = dynamic(
  () =>
    import("@/components/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="mt-1.5 min-h-[14rem] rounded-lg border border-peach/70 bg-white px-3 py-2 text-sm text-brand/50">
        Loading editor…
      </div>
    ),
  }
);

const initialState: SaveLandingContentState = { ok: false };

function Field({
  label,
  name,
  value,
  onChange,
  multiline = false,
  rows = 3,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  const className =
    "mt-1.5 w-full rounded-lg border border-peach/70 bg-white px-3 py-2 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand/55">
        {label}
      </span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      )}
    </label>
  );
}

export function LandingContentEditor({
  initialContent,
}: {
  initialContent: LandingContent;
}) {
  const [content, setContent] = useState(initialContent);
  const [state, formAction, pending] = useActionState(
    saveLandingContentAction,
    initialState
  );

  function update<K extends keyof LandingContent>(key: K, value: LandingContent[K]) {
    setContent((prev) => ({ ...prev, [key]: value }));
  }

  function updateFeature(
    index: number,
    key: keyof LandingFeature,
    value: string
  ) {
    setContent((prev) => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? { ...feature, [key]: value } : feature
      ),
    }));
  }

  function addFeature() {
    setContent((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { eyebrow: "New", title: "Feature title", body: "Feature description." },
      ],
    }));
  }

  function removeFeature(index: number) {
    setContent((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-6">
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="featureCount" value={content.features.length} />

        <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand/50">
            Hero
          </h2>
          <div className="mt-4 space-y-3">
            <Field
              label="Headline"
              name="heroHeadline"
              value={content.heroHeadline}
              onChange={(v) => update("heroHeadline", v)}
            />
            <Field
              label="Supporting copy"
              name="heroSubcopy"
              value={content.heroSubcopy}
              onChange={(v) => update("heroSubcopy", v)}
              multiline
              rows={3}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand/50">
            About section
          </h2>
          <div className="mt-4 space-y-3">
            <Field
              label="Eyebrow"
              name="aboutEyebrow"
              value={content.aboutEyebrow}
              onChange={(v) => update("aboutEyebrow", v)}
            />
            <Field
              label="Title"
              name="aboutTitle"
              value={content.aboutTitle}
              onChange={(v) => update("aboutTitle", v)}
            />
            <Field
              label="Body"
              name="aboutBody"
              value={content.aboutBody}
              onChange={(v) => update("aboutBody", v)}
              multiline
              rows={5}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand/50">
              Features
            </h2>
            <button
              type="button"
              onClick={addFeature}
              className="rounded-lg border border-peach/70 px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-peach/35"
            >
              Add feature
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <Field
              label="Eyebrow"
              name="featuresEyebrow"
              value={content.featuresEyebrow}
              onChange={(v) => update("featuresEyebrow", v)}
            />
            <Field
              label="Section title"
              name="featuresTitle"
              value={content.featuresTitle}
              onChange={(v) => update("featuresTitle", v)}
            />
          </div>
          <div className="mt-4 space-y-4">
            {content.features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-peach/45 bg-white/70 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-brand/50">
                    Feature {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    disabled={content.features.length <= 1}
                    className="text-xs font-semibold text-rose-700 hover:underline disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-2">
                  <Field
                    label="Eyebrow"
                    name={`featureEyebrow_${index}`}
                    value={feature.eyebrow}
                    onChange={(v) => updateFeature(index, "eyebrow", v)}
                  />
                  <Field
                    label="Title"
                    name={`featureTitle_${index}`}
                    value={feature.title}
                    onChange={(v) => updateFeature(index, "title", v)}
                  />
                  <Field
                    label="Body"
                    name={`featureBody_${index}`}
                    value={feature.body}
                    onChange={(v) => updateFeature(index, "body", v)}
                    multiline
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand/50">
            Bottom line
          </h2>
          <div className="mt-4 space-y-3">
            <Field
              label="Eyebrow"
              name="bottomEyebrow"
              value={content.bottomEyebrow}
              onChange={(v) => update("bottomEyebrow", v)}
            />
            <Field
              label="Title"
              name="bottomTitle"
              value={content.bottomTitle}
              onChange={(v) => update("bottomTitle", v)}
            />
            <Field
              label="Body"
              name="bottomBody"
              value={content.bottomBody}
              onChange={(v) => update("bottomBody", v)}
              multiline
              rows={4}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand/50">
            Pitch + footer
          </h2>
          <div className="mt-4 space-y-3">
            <Field
              label="Pitch eyebrow"
              name="pitchEyebrow"
              value={content.pitchEyebrow}
              onChange={(v) => update("pitchEyebrow", v)}
            />
            <RichTextEditor
              label="Pitch body"
              name="pitchHtml"
              value={content.pitchHtml}
              onChange={(html) => update("pitchHtml", html)}
            />
            <Field
              label="Footer tagline"
              name="footerTagline"
              value={content.footerTagline}
              onChange={(v) => update("footerTagline", v)}
            />
          </div>
        </section>

        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-peach/60 bg-[var(--salestower-surface)]/95 p-3 shadow-lg backdrop-blur">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-sand hover:bg-[#034a5c] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save & publish"}
          </button>
          <Link
            href="/"
            target="_blank"
            className="rounded-lg border border-peach/70 px-4 py-2 text-sm font-semibold text-brand hover:bg-peach/35"
          >
            Open live site
          </Link>
          {state.ok ? (
            <p className="text-sm font-semibold text-emerald-700">
              Published. Landing page updated.
            </p>
          ) : null}
          {state.error ? (
            <p className="text-sm font-semibold text-rose-700">{state.error}</p>
          ) : null}
        </div>
      </form>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-2xl border border-peach/60 bg-brand p-5 text-sand shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-peach">
            Live preview
          </p>
          <p className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight">
            SalesTower
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-syne)] text-xl font-bold leading-tight text-peach">
            {content.heroHeadline || "Headline"}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-sand/85">
            {content.heroSubcopy || "Supporting copy"}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-peach/60 bg-[var(--salestower-surface)] p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand/55">
            {content.pitchEyebrow || "Pitch"}
          </p>
          <div className="mt-4 border-l-4 border-peach pl-4">
            <LandingRichHtml
              html={content.pitchHtml}
              className="!text-base md:!text-lg"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
