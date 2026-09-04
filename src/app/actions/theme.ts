"use server";
import { cookies } from "next/headers";
import { THEME_COOKIE, themeCookieOptions } from "@/lib/theme";

export async function changeTheme(form: FormData) {
  const theme = form.get("theme");
  if (theme !== "light" && theme !== "dark") return;
  (await cookies()).set(THEME_COOKIE, theme, themeCookieOptions(process.env.NODE_ENV === "production"));
}
