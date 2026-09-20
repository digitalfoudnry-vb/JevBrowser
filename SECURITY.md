# Security policy and boundaries

This repository runs a browser against untrusted public websites and transmits
page state to the configured AI provider. Do not use it with private data or
credentials that must not leave your environment.

Report suspected vulnerabilities privately to the repository owner through
GitHub private vulnerability reporting if enabled, or arrange a private channel
with the owner. Do not post credentials or sensitive reproductions in issues.
There is no independent certification, bug bounty or guaranteed response SLA.

## Controls

- Exact host allowlist for pages, subresources, redirects and popups.
- HTTP(S), web ports only, no embedded URL credentials.
- Public IP validation and a browser egress proxy connecting to the validated IP;
  mixed public/private DNS answers are rejected and the browser cannot resolve
  a second address for the same proxy connection.
- Chromium sandbox enabled, fresh context, no user profile, no downloads,
  blocked service workers and WebSockets, QUIC disabled and non-proxied WebRTC
  UDP disabled. Browser startup does not receive provider secret variables.
- Typing and Enter submission default off; unsafe HTTP methods default blocked.
- Bounded inputs, model action validation, deadline/caller cancellation cleanup.
- Locked dependencies, explicit installation, CI checks and security regression tests.

## Limits

These controls are defense in depth, not an OS network sandbox. Use a restricted
container/VM and network firewall for high-risk sites. DNS resolution itself
uses the host resolver. Public allowlisted websites can still receive task data,
mutate state on GET, contain malicious scripts or manipulate the model. A
malicious browser exploit, OS compromise, proxy bypass in Chromium or operator
configuration is outside the application-level guarantees.

Provider and typing endpoints are trusted operator configuration; browser
egress rules do not restrict Node's model API calls. Never let web page content
change those variables. HTML, screenshots, URLs and page diagnostics are
untrusted and may contain sensitive content; output should not be executed or
published without review. Known environment secrets are redacted from errors,
but this is not general data-loss prevention.

Cost is an estimate based on the inherited Jev input-rate constant, excluding
the typing model and provider-specific fees. Use provider billing for actual
spend. Step/time bounds are not monetary limits.

Remaining review and test scope is recorded in docs/security-review.md.
