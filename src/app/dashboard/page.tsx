import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { boardPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

/** Legacy `/dashboard` → dealership slug board URL. */
export default async function DashboardRedirectPage() {
  const user = await requireUser();
  redirect(boardPath(user.organizationSlug));
}
