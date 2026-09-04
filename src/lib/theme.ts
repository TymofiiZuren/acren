export type Theme = "light" | "dark";
export const THEME_COOKIE = "acren-theme";
export function parseTheme(value: unknown): Theme { return value === "light" ? "light" : "dark"; }
export function themeCookieOptions(production: boolean) {
  return { httpOnly: true, secure: production, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 180 };
}
