import test from 'node:test';
import assert from 'node:assert/strict';
import pathToRegexp from 'next/dist/compiled/path-to-regexp/index.js';

async function loadConfig(value) {
  if (value === undefined) delete process.env.API_PROXY_URL;
  else process.env.API_PROXY_URL = value;
  return (await import(`../next.config.mjs?test=${Math.random()}`)).default;
}

test('without proxy the existing routes are preserved', async () => {
  const config = await loadConfig(undefined);
  assert.deepEqual(config.rewrites ? await config.rewrites() : [], []);
});

test('proxy preserves API prefix and normalizes trailing slash', async () => {
  for (const url of ['https://demo.trycloudflare.com', 'https://demo.trycloudflare.com/']) {
    const config = await loadConfig(url);
    assert.equal(config.skipTrailingSlashRedirect, true);
    assert.deepEqual(await config.rewrites(), [{
      source: '/api/:path(.*/)', destination: 'https://demo.trycloudflare.com/api/:path',
    }, {
      source: '/api/:path*', destination: 'https://demo.trycloudflare.com/api/:path*',
    }]);
  }
});

test('rejects invalid origins rather than sending credentials elsewhere', async () => {
  for (const url of ['invalid', 'ftp://example.com', 'https://user:pass@example.com',
    'https://example.com/api', 'https://example.com?x=1', 'https://example.com/#token']) {
    await assert.rejects(() => loadConfig(url), /API_PROXY_URL/);
  }
});

test('optional trailing slash matching never adds a slash to ordinary API routes', async () => {
  const config = await loadConfig('https://demo.trycloudflare.com');
  const rules = await config.rewrites();
  for (const path of ['/api/identity/users', '/api/catalog/genres', '/api/catalog/sessions/']) {
    let destination;
    for (const rule of rules) {
      const matched = pathToRegexp.match(rule.source, { strict: false })(path);
      if (matched) {
        destination = pathToRegexp.compile(new URL(rule.destination).pathname, { validate: false })(matched.params);
        break;
      }
    }
    assert.equal(destination, path);
  }
});
