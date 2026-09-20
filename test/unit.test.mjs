import assert from "node:assert/strict";
import { test } from "node:test";
import { publicUrl, isPublicAddress, safeError, validateStepAnswers } from "../dist/jev/security.js";

test("publicUrl allows valid public http/https URLs", () => {
  const u1 = publicUrl("https://example.com/docs");
  assert.equal(u1.hostname, "example.com");
  const u2 = publicUrl("http://example.com:80");
  assert.equal(u2.port, "");
});

test("publicUrl rejects private hostnames, loopbacks, credentials and non-web ports", () => {
  assert.throws(() => publicUrl("http://localhost:3000"), /Private hostnames are blocked/);
  assert.throws(() => publicUrl("http://127.0.0.1:80"), /Non-public IP address blocked/);
  assert.throws(() => publicUrl("http://internal.lan/"), /Private hostnames are blocked/);
  assert.throws(() => publicUrl("http://user:pass@example.com/"), /Only HTTP\(S\) URLs without embedded credentials/);
  assert.throws(() => publicUrl("https://example.com:8080/"), /Only public web ports 80 and 443 are allowed/);
  assert.throws(() => publicUrl("ftp://example.com/"), /Only HTTP\(S\) URLs without embedded credentials/);
});

test("isPublicAddress identifies public vs private IPv4 and IPv6", () => {
  assert.equal(isPublicAddress("127.0.0.1"), false);
  assert.equal(isPublicAddress("10.0.0.1"), false);
  assert.equal(isPublicAddress("192.168.1.1"), false);
  assert.equal(isPublicAddress("169.254.169.254"), false);
  assert.equal(isPublicAddress("::1"), false);
  assert.equal(isPublicAddress("fe80::1"), false);
  assert.equal(isPublicAddress("fc00::1"), false);
  assert.equal(isPublicAddress("93.184.216.34"), true);
  assert.equal(isPublicAddress("2606:2800:220:1:248:1893:25c8:1946"), true);
});

test("safeError redacts sensitive keys and bearer tokens", () => {
  process.env.TEST_API_KEY = "sk-test-super-secret-key-12345";
  const sanitized = safeError(new Error("Failed connecting with key sk-test-super-secret-key-12345 and Bearer abcdef1234567890"));
  assert.match(sanitized, /\[REDACTED\]/);
  assert.doesNotMatch(sanitized, /sk-test-super-secret-key-12345/);
  delete process.env.TEST_API_KEY;
});

test("validateStepAnswers rejects choices outside offered criteria", () => {
  const criteria = {
    click_e1: "button Submit",
    done: "task is complete",
  };
  const valid = {
    action: { choice: "click_e1", probabilities: { click_e1: 0.9, malicious_action: 0.1 } },
    goal_done: { noul: 0.2 },
    stuck: { noul: 0.1 },
  };
  const verified = validateStepAnswers(valid, criteria);
  assert.equal(verified.action.choice, "click_e1");
  assert.equal(verified.action.probabilities.malicious_action, undefined);

  assert.throws(
    () => validateStepAnswers({ ...valid, action: { choice: "unoffered_action" } }, criteria),
    /Model returned an action outside the offered choices/,
  );
});
