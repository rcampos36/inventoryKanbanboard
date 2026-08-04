import { City, State } from "country-state-city";

const US = "US";

export type UsStateOption = {
  code: string;
  name: string;
};

let cachedStates: UsStateOption[] | null = null;

export function getUsStates(): UsStateOption[] {
  if (!cachedStates) {
    cachedStates = State.getStatesOfCountry(US)
      .map((state) => ({ code: state.isoCode, name: state.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return cachedStates;
}

export function getUsCitiesForState(stateCode: string): string[] {
  if (!stateCode) return [];
  const names = City.getCitiesOfState(US, stateCode.toUpperCase()).map(
    (city) => city.name
  );
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}

export function isValidUsStateCode(stateCode: string): boolean {
  const code = stateCode.trim().toUpperCase();
  return getUsStates().some((state) => state.code === code);
}

export function isValidUsCity(stateCode: string, city: string): boolean {
  const normalizedCity = city.trim().toLowerCase();
  if (!normalizedCity || !isValidUsStateCode(stateCode)) return false;
  return getUsCitiesForState(stateCode).some(
    (entry) => entry.toLowerCase() === normalizedCity
  );
}

/** Resolve a state code (preferred) or full name to the 2-letter code. */
export function resolveUsStateCode(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const byCode = getUsStates().find((state) => state.code === upper);
  if (byCode) return byCode.code;
  const byName = getUsStates().find(
    (state) => state.name.toLowerCase() === raw.toLowerCase()
  );
  return byName?.code ?? null;
}
