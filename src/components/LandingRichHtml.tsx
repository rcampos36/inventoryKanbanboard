import { sanitizeLandingHtml } from "@/lib/sanitize-html";

/** Renders sanitized landing-page rich text with brand typography. */
export function LandingRichHtml({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  const safe = sanitizeLandingHtml(html);
  if (!safe) return null;

  return (
    <div
      className={[
        "landing-rich-html",
        "space-y-4 font-[family-name:var(--font-syne)] text-xl font-semibold leading-snug tracking-tight text-brand md:text-2xl md:leading-snug",
        "[&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-bold md:[&_h2]:text-3xl",
        "[&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold md:[&_h3]:text-2xl",
        "[&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0 [&_p:first-child]:mt-0",
        "[&_p]:my-3 [&_p]:font-semibold",
        "[&_ul]:my-3 [&_ul]:list-none [&_ul]:space-y-2 [&_ul]:pl-0",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
        "[&_li]:relative [&_li]:pl-4 [&_li]:font-semibold",
        "[&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:content-['–']",
        "[&_strong]:font-extrabold",
        className,
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
