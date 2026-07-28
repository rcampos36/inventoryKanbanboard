import { signOut } from "@/auth";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
}

export function UserMenu({ name, email }: UserMenuProps) {
  const label = name?.trim() || email || "Account";

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-40 truncate text-sm font-medium text-slate-600 sm:inline">
        {label}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
