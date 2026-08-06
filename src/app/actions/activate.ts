"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { boardPath } from "@/lib/paths";
import {
  orgIsSubscriptionActive,
  serialCompareKey,
} from "@/lib/subscription-serial";

export type ActivateFormState = {
  error?: string;
  success?: string;
};

export async function activateSubscriptionAction(
  _prev: ActivateFormState,
  formData: FormData
): Promise<ActivateFormState> {
  const user = await requireUser({ allowTrialExpired: true });

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: {
      id: true,
      planStatus: true,
      trialEndsAt: true,
      serialActivatedAt: true,
      subscriptionSerial: true,
      slug: true,
    },
  });

  if (!org) {
    return { error: "Dealership not found." };
  }

  if (
    orgIsSubscriptionActive({
      id: org.id,
      planStatus: org.planStatus,
      trialEndsAt: org.trialEndsAt,
      serialActivatedAt: org.serialActivatedAt,
    })
  ) {
    redirect(boardPath(org.slug));
  }

  const entered = String(formData.get("serial") ?? "");
  if (!serialCompareKey(entered)) {
    return { error: "Enter the activation serial from your welcome email." };
  }

  if (
    serialCompareKey(entered) !== serialCompareKey(org.subscriptionSerial)
  ) {
    return { error: "That serial does not match this dealership. Try again." };
  }

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      planStatus: "active",
      serialActivatedAt: new Date(),
    },
  });

  redirect(boardPath(org.slug));
}
