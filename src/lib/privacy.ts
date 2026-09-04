export function sessionCookieOptions(production: boolean) {
  // Auth is server-only in this app; there is no browser Supabase client.
  return { httpOnly: true, sameSite: "lax" as const, secure: production, path: "/" };
}

export function parseSearch(value: unknown, pageValue: unknown) {
  if (typeof value !== "string") return null;
  const term = value.trim();
  const page = Number(pageValue);
  if (term.length > 120 || !/^[\p{L}\p{N}\s'’./-]*$/u.test(term)) return null;
  if (!Number.isSafeInteger(page) || page < 0 || page > 100000) return null;
  return { term, page };
}

const notices: Record<string, string> = {
  added: "Client added.", updated: "Client updated.",
  archived: "Client archived. You can restore them from Archived.", restored: "Client restored to your active book.",
};
export function noticeMessage(code?: string) {
  return code && Object.hasOwn(notices, code) ? notices[code] : undefined;
}

export function securityHeaders() {
  return [
    { key: "Referrer-Policy", value: "no-referrer" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // Restrict dangerous capabilities without unsafe-inline or breaking Next's script handling.
    // A nonce-based script policy remains a production hardening item.
    { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" },
  ];
}
