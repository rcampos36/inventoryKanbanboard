import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { boardPath } from "@/lib/paths";

const linkClass =
  "rounded-lg border border-peach/70 bg-[var(--salestower-surface)] px-3 py-2 text-sm font-semibold text-brand hover:bg-peach/35";

export function PlatformAdminNav({
  organizationSlug,
  active,
}: {
  organizationSlug: string;
  active?: "dealerships" | "demos" | "landing" | "users";
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/admin/dealerships"
        className={[
          linkClass,
          active === "dealerships" ? "bg-peach/40" : "",
        ].join(" ")}
      >
        Dealerships
      </Link>
      <Link
        href="/admin/demos"
        className={[linkClass, active === "demos" ? "bg-peach/40" : ""].join(
          " "
        )}
      >
        Demo requests
      </Link>
      <Link
        href="/admin/landing"
        className={[linkClass, active === "landing" ? "bg-peach/40" : ""].join(
          " "
        )}
      >
        Landing copy
      </Link>
      <Link
        href="/admin"
        className={[linkClass, active === "users" ? "bg-peach/40" : ""].join(
          " "
        )}
      >
        My store users
      </Link>
      <Link href={boardPath(organizationSlug)} className={linkClass}>
        Back to board
      </Link>
      <form action={logoutAction}>
        <button type="submit" className={linkClass}>
          Sign out
        </button>
      </form>
    </div>
  );
}
