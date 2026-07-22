/**
 * Short dealer-style trim labels for compact chips.
 * Examples:
 * - "2.5 S Select Sport" → "Sel Spt"
 * - "2.5 S Premium Plus" → "Prem+"
 * - "3.3 Turbo S Premium Plus" → "Turbo S Prem+"
 * - "Hybrid Premium Plus" → "Hyb Prem+"
 * - "Grand Touring" → "GT"
 */
export function abbreviateTrim(trim: string): string {
  let value = trim.trim();
  if (!value) return "";

  value = value
    .replace(/\b2\.5\s*S\b/gi, "")
    .replace(/\b2\.5\s*Turbo\b/gi, "Turbo")
    .replace(/\b3\.3\s*Turbo\b/gi, "Turbo")
    .replace(/\bSelect Sport\b/gi, "Sel Spt")
    .replace(/\bSelect\b/gi, "Sel")
    .replace(/\bPreferred\b/gi, "Pref")
    .replace(/\bPremium Plus\b/gi, "Prem+")
    .replace(/\bPremium Sport\b/gi, "Prem Spt")
    .replace(/\bPremium\b/gi, "Prem")
    .replace(/\bCarbon Edition\b/gi, "Carbon")
    .replace(/\bMeridian Edition\b/gi, "Meridian")
    .replace(/\bAire Edition\b/gi, "Aire")
    .replace(/\bGrand Touring\b/gi, "GT")
    .replace(/\bHybrid\b/gi, "Hyb")
    .replace(/\bPHEV\b/gi, "PHEV")
    .replace(/\bSC Plus\b/gi, "SC+")
    .replace(/\s+/g, " ")
    .trim();

  return value || trim.trim();
}

/** Compact title for new-car chips: "2026 CX-5 Pref" */
export function formatNewCarLabel(car: {
  year: number;
  model: string;
  trim: string;
}): string {
  const trim = abbreviateTrim(car.trim);
  return trim
    ? `${car.year} ${car.model} ${trim}`
    : `${car.year} ${car.model}`;
}
