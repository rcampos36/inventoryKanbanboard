export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
};

export const SESSION_COOKIE = "ikb_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days
