import assert from 'node:assert/strict';
import test from 'node:test';
import { validateHostedConfiguration } from './deployment.ts';

test('hosted builds reject missing, local and malformed Supabase configuration', () => {
  for (const url of [undefined, '', 'http://127.0.0.1:54321', 'https://localhost', 'https://10.0.0.1', 'https://example.com', 'https://user:pass@demo.supabase.co', 'https://demo.supabase.co/path']) {
    assert.throws(() => validateHostedConfiguration(url, 'sb_publishable_test'), /Hosted configuration/);
  }
  for (const key of [undefined, '', 'placeholder', 'sb_secret_private']) {
    assert.throws(() => validateHostedConfiguration('https://demo.supabase.co', key), /Hosted configuration/);
  }
});
test('hosted builds accept the supported hosted URL and publishable key format', () => {
  assert.doesNotThrow(() => validateHostedConfiguration('https://demo.supabase.co', 'sb_publishable_test'));
});
