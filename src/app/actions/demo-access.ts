"use server";

import { timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import {
  createDemoAccessToken,
  getDemoBoardPassword,
  setDemoAccessCookie,
} from "@/lib/demo-access";

export type DemoAccessFormState = {
  error?: string;
};

function passwordsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function unlockDemoAction(
  _prev: DemoAccessFormState,
  formData: FormData
): Promise<DemoAccessFormState> {
  const expected = getDemoBoardPassword();
  if (!expected) {
    return {
      error:
        "Demo access is not configured. Set DEMO_BOARD_PASSWORD in the environment.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { error: "Enter the demo password." };
  }

  if (!passwordsMatch(password, expected)) {
    return { error: "Incorrect password." };
  }

  const token = await createDemoAccessToken();
  await setDemoAccessCookie(token);
  redirect("/demo");
}
