import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const DEMO_ACCESS_COOKIE = "ikb_demo_access";
/** Keep demo unlock for a workday-length sales session. */
export const DEMO_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it in .env.local and Vercel Environment Variables."
    );
  }
  return new TextEncoder().encode(secret);
}

/** Shared password for the /demo sandbox board. */
export function getDemoBoardPassword(): string | null {
  const password = process.env.DEMO_BOARD_PASSWORD?.trim();
  return password || null;
}

export async function createDemoAccessToken(): Promise<string> {
  return new SignJWT({ purpose: "demo-board" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DEMO_ACCESS_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function hasDemoAccess(): Promise<boolean> {
  if (!getDemoBoardPassword()) return false;

  const jar = await cookies();
  const token = jar.get(DEMO_ACCESS_COOKIE)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.purpose === "demo-board";
  } catch {
    return false;
  }
}

export async function setDemoAccessCookie(token: string) {
  const jar = await cookies();
  jar.set(DEMO_ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/demo",
    maxAge: DEMO_ACCESS_MAX_AGE_SECONDS,
  });
}

export async function clearDemoAccessCookie() {
  const jar = await cookies();
  jar.set(DEMO_ACCESS_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/demo",
    maxAge: 0,
  });
}
