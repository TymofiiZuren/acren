// The supported hosted target is Supabase Cloud. Local production smoke tests
// remain possible outside Vercel. Never include supplied values in errors.
export function validateHostedConfiguration(url: string | undefined, key: string | undefined) {
  let validUrl = false;
  try {
    const parsed = new URL(url ?? '');
    validUrl = parsed.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname)
      && !parsed.username && !parsed.password && !parsed.port
      && parsed.pathname === '/' && !parsed.search && !parsed.hash;
  } catch { /* Fail closed with a redacted diagnostic below. */ }
  if (!validUrl || !key || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error('Hosted configuration is incomplete: use the approved Supabase Cloud HTTPS URL and publishable key. Local URLs, secret keys and placeholders are not supported.');
  }
}
