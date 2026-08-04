import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  type SessionUser,
} from "@/lib/session-types";
import { DEFAULT_PLAN_ID, isPlanId } from "@/lib/plans";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not set. Add it in .env.local and Vercel Environment Variables."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
    organizationSlug: user.organizationSlug,
    organizationBrand: user.organizationBrand,
    organizationPlan: user.organizationPlan,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function readSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const id = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const name = typeof payload.name === "string" ? payload.name : null;
    const role =
      payload.role === "ADMIN" || payload.role === "USER" ? payload.role : null;
    const organizationId =
      typeof payload.organizationId === "string"
        ? payload.organizationId
        : null;
    const organizationName =
      typeof payload.organizationName === "string"
        ? payload.organizationName
        : null;
    const organizationSlug =
      typeof payload.organizationSlug === "string"
        ? payload.organizationSlug
        : null;
    const organizationBrand =
      typeof payload.organizationBrand === "string"
        ? payload.organizationBrand
        : "Mazda";
    const organizationPlan =
      typeof payload.organizationPlan === "string" &&
      isPlanId(payload.organizationPlan)
        ? payload.organizationPlan
        : DEFAULT_PLAN_ID;
    if (
      !id ||
      !email ||
      !name ||
      !role ||
      !organizationId ||
      !organizationName ||
      !organizationSlug
    ) {
      return null;
    }
    return {
      id,
      email,
      name,
      role,
      organizationId,
      organizationName,
      organizationSlug,
      organizationBrand,
      organizationPlan,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
