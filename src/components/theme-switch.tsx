import { cookies } from "next/headers";
import { changeTheme } from "@/app/actions/theme";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import { SubmitButton } from "@/components/submit-button";

export async function ThemeSwitch() {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const next = theme === "dark" ? "light" : "dark";
  return <form action={changeTheme} data-preserve-draft="true">
    <input type="hidden" name="theme" value={next} />
    <SubmitButton className="button-quiet" pendingLabel="Changing theme…">Switch to {next} theme</SubmitButton>
  </form>;
}
