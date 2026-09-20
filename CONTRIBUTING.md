# Contributing

Use Node.js 22.18+ and install with `npm ci --ignore-scripts`. Run `npm run check`,
`npm run browser:install`, `npm run test:browser` and `npm audit --audit-level=low`
before proposing changes. No credentials are required for these checks.

Include an observable regression test for a security or behavior fix. Preserve
upstream attribution and document any change to network scope, data sent to
providers, typing/submission behavior or authorization expectations. Do not add
an allow-private-network bypass or disable Chromium's sandbox to make tests pass.

Live provider tests are opt-in and billed by the configured provider. Keep all
keys outside commits, fixtures and logs. Use private reporting for sensitive
security findings; see SECURITY.md.
