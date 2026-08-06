"use server";

import { timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import {
  createPlatformAccessToken,
  getPlatformBackendPassword,
  setPlatformAccessCookie,
} from "@/lib/platform-access";

export type PlatformAccessFormState = {
  error?: string;
};

function passwordsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function unlockPlatformAction(
  _prev: PlatformAccessFormState,
  formData: FormData
): Promise<PlatformAccessFormState> {
  const expected = getPlatformBackendPassword();
  if (!expected) {
    return {
      error:
        "Platform access is not configured. Set PLATFORM_BACKEND_PASSWORD in the environment.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { error: "Enter the platform password." };
  }

  if (!passwordsMatch(password, expected)) {
    return { error: "Incorrect password." };
  }

  const token = await createPlatformAccessToken();
  await setPlatformAccessCookie(token);
  redirect("/admin/dealerships");
}
