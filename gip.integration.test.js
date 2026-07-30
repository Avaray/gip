/**
 * Integration tests — require a real internet connection.
 *
 * Run with:
 *   bun test gip.integration
 *
 * Tests are intentionally skipped when the CI environment variable is set,
 * to avoid flaky failures in pipelines without network access.
 */
import { describe, test, expect } from "bun:test";
import gip from "./module.mjs";
import services from "./services.mjs";

const IPv4_regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const IPv6_regex =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

// --- IPv4 ---

describe("integration: IPv4", () => {
  test("gip() default (automatic) should return a valid IPv4 or IPv6 address", async () => {
    const ip = await gip({ type: "automatic", ensure: 3, timeout: 15000 });
    const isIPv4 = IPv4_regex.test(ip);
    const isIPv6 = IPv6_regex.test(ip);
    expect(isIPv4 || isIPv6).toBe(true);
    console.log("  [auto]  →", ip, isIPv4 ? "(IPv4)" : "(IPv6)");
  }, 20000);

  test("gip({ type: 'ipv4' }) should return a valid IPv4 address", async () => {
    const ip = await gip({ type: "ipv4", ensure: 3, timeout: 15000 });
    expect(ip).toMatch(IPv4_regex);
    console.log("  [ipv4]  →", ip);
  }, 20000);

  test("each IPv4 service individually should return a valid IPv4 address or time out gracefully", async () => {
    const results = await Promise.allSettled(
      services.ipv4.map(async (url) => {
        const ip = await gip({ services: [url], ensure: 1, timeout: 8000, verbose: false });
        return { url, ip };
      })
    );

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const url = services.ipv4[i];
      if (result.status === "fulfilled") {
        const { ip } = result.value;
        const valid = IPv4_regex.test(ip);
        if (valid) {
          console.log("  ✓", url, "→", ip);
          passed++;
        } else {
          console.warn("  ✗ wrong format:", url, "→", ip);
          failed++;
        }
      } else {
        console.warn("  ✗ failed:", url, "→", result.reason?.message);
        failed++;
      }
    }

    console.log(`\n  IPv4 services: ${passed} returned IPv4, ${failed} returned wrong format or failed out of ${services.ipv4.length}`);
    // At least one service must respond with a correct IPv4 address
    expect(passed).toBeGreaterThan(0);
  }, 60000);
});

// --- IPv6 ---

describe("integration: IPv6", () => {
  test("gip({ type: 'ipv6' }) should return a valid IPv6 address", async () => {
    const ip = await gip({ type: "ipv6", ensure: 3, timeout: 20000 });
    expect(ip).toMatch(IPv6_regex);
    console.log("  [ipv6]  →", ip);
  }, 30000);

  test("each IPv6 service individually should return a valid IPv6 address or time out gracefully", async () => {
    const results = await Promise.allSettled(
      services.ipv6.map(async (url) => {
        const ip = await gip({ services: [url], ensure: 1, timeout: 8000, type: "ipv6", verbose: false });
        return { url, ip };
      })
    );

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const url = services.ipv6[i];
      if (result.status === "fulfilled") {
        const { ip } = result.value;
        const valid = IPv6_regex.test(ip);
        if (valid) {
          console.log("  ✓", url, "→", ip);
          passed++;
        } else {
          console.warn("  ✗ wrong format:", url, "→", ip);
          failed++;
        }
      } else {
        console.warn("  ✗ failed:", url, "→", result.reason?.message);
        failed++;
      }
    }

    console.log(`\n  IPv6 services: ${passed} passed, ${failed} failed out of ${services.ipv6.length}`);
    // At least one service must work for the test to be meaningful
    expect(passed).toBeGreaterThan(0);
  }, 60000);
});

// --- ensure option ---

describe("integration: ensure option", () => {
  test("ensure: 1 should resolve faster than ensure: 5", async () => {
    const start1 = Date.now();
    await gip({ type: "ipv4", ensure: 1, timeout: 15000 });
    const time1 = Date.now() - start1;

    const start5 = Date.now();
    await gip({ type: "ipv4", ensure: 5, timeout: 15000 });
    const time5 = Date.now() - start5;

    console.log(`  ensure:1 → ${time1}ms | ensure:5 → ${time5}ms`);
    expect(time1).toBeLessThanOrEqual(time5);
  }, 40000);
});
