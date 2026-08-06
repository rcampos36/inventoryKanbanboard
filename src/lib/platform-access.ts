import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const PLATFORM_ACCESS_COOKIE = "ikb_platform_access";
/** Keep platform unlock for a workday-length admin session. */
export const PLATFORM_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it in .env.local and Vercel Environment Variables."
    );
  }
  return new TextEncoder().encode(secret);
}

/** Shared password for the password-gated platform backend entry. */
export function getPlatformBackendPassword(): string | null {
  const password = process.env.PLATFORM_BACKEND_PASSWORD?.trim();
  return password || null;
}

export async function createPlatformAccessToken(): Promise<string> {
  return new SignJWT({ purpose: "platform-backend" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PLATFORM_ACCESS_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function hasPlatformAccess(): Promise<boolean> {
  if (!getPlatformBackendPassword()) return false;

  const jar = await cookies();
  const token = jar.get(PLATFORM_ACCESS_COOKIE)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.purpose === "platform-backend";
  } catch {
    return false;
  }
}

export async function setPlatformAccessCookie(token: string) {
  const jar = await cookies();
  jar.set(PLATFORM_ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PLATFORM_ACCESS_MAX_AGE_SECONDS,
  });
}
