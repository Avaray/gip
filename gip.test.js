import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import gip from "./module.mjs";
import defaultServices from "./services.mjs";

describe("gip module", () => {
  let server;
  let requestCount = 0;
  const originalIpv4 = [...defaultServices.ipv4];
  const originalIpv6 = [...defaultServices.ipv6];

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      async fetch(req) {
        requestCount++;
        const url = new URL(req.url);

        if (url.pathname === "/slow") {
          await Bun.sleep(5000);
          return new Response("1.2.3.4");
        }
        if (url.pathname === "/ipv4") {
          return new Response("5.5.5.5");
        }
        if (url.pathname === "/ipv6") {
          return new Response("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
        }
        if (url.pathname === "/ipv6-short") {
          return new Response("::1");
        }
        if (url.pathname === "/not-ip") {
          return new Response("not-an-ip");
        }
        if (url.pathname === "/invalid-ipv4") {
          return new Response("999.999.999.999");
        }
        if (url.pathname.startsWith("/mix-ipv4")) {
          if (requestCount < 3) return new Response("999.999.999.999");
          return new Response("10.0.0.1");
        }
        if (url.pathname.startsWith("/mix-ipv6")) {
          if (requestCount < 2) return new Response("1.2.3.4");
          return new Response("::1");
        }
        if (url.pathname === "/timeout") {
          await Bun.sleep(5000);
          return new Response("1.2.3.4");
        }

        return new Response("1.2.3.4");
      },
    });
  });

  beforeEach(() => {
    // Clear default services to isolate tests that use local mock server
    defaultServices.ipv4.length = 0;
    defaultServices.ipv6.length = 0;
    requestCount = 0;
  });

  afterAll(() => {
    // Restore default services
    defaultServices.ipv4.push(...originalIpv4);
    defaultServices.ipv6.push(...originalIpv6);
    server.stop(true);
  });

  const getUrl = (path) => `http://localhost:${server.port}${path}`;

  // --- Core behavior ---

  test("should resolve instantly and not wait for all fetches to settle", async () => {
    const start = Date.now();
    const ip = await gip({
      services: [getUrl("/slow"), getUrl("/")],
      ensure: 1,
      timeout: 10000,
    });
    const elapsed = Date.now() - start;

    expect(ip).toBe("1.2.3.4");
    // Should resolve well before the slow mock would respond
    expect(elapsed).toBeLessThan(2000);
  });

  // --- ensure option ---

  test("should require ensure count matching IPs before resolving", async () => {
    const ip = await gip({
      services: [getUrl("/ipv4?1"), getUrl("/ipv4?2"), getUrl("/ipv4?3")],
      ensure: 3,
      timeout: 5000,
    });
    expect(ip).toBe("5.5.5.5");
    expect(requestCount).toBeGreaterThanOrEqual(3);
  });

  test("should throw if ensure count exceeds total number of services", async () => {
    defaultServices.ipv4.push(...originalIpv4);
    defaultServices.ipv6.push(...originalIpv6);
    const totalServices = defaultServices.ipv4.length + defaultServices.ipv6.length;
    await expect(gip({ ensure: totalServices + 1 })).rejects.toThrow(/Maximum ensure count/);
  });

  // --- Type handling ---

  test("should resolve IPv6 address when type is ipv6", async () => {
    const ip = await gip({
      services: [getUrl("/ipv6")],
      ensure: 1,
      type: "ipv6",
      timeout: 2000,
    });
    expect(ip).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
  });

  test("should ignore IPv4 address when type is ipv6", async () => {
    const ip = await gip({
      services: [getUrl("/mix-ipv6?1"), getUrl("/mix-ipv6?2")],
      ensure: 1,
      type: "ipv6",
      timeout: 2000,
    });
    expect(ip).toBe("::1");
  });

  test("should resolve first matched type (IPv6) when type is automatic", async () => {
    const ip = await gip({
      services: [getUrl("/ipv6-short")],
      ensure: 1,
      type: "automatic",
      timeout: 2000,
    });
    expect(ip).toBe("::1");
  });

  // --- Services URL formatting ---

  test("should not mutate the original services array passed by the caller", async () => {
    const myServices = [getUrl("/ipv4")];
    const original = [...myServices];

    await gip({ services: myServices, ensure: 1, timeout: 2000 });

    expect(myServices).toEqual(original);
  });

  // --- Error cases ---

  test("should throw if no valid IP is found within the timeout", async () => {
    await expect(
      gip({ services: [getUrl("/timeout")], ensure: 1, timeout: 100 })
    ).rejects.toThrow(/No valid IP addresses found within/);
  });

  test("should ignore responses that are not valid IPv4 addresses", async () => {
    const ip = await gip({
      services: [
        getUrl("/not-ip"),
        getUrl("/not-ip"),
        getUrl("/not-ip"),
        getUrl("/not-ip"),
        getUrl("/"), // returns 1.2.3.4
      ],
      ensure: 1,
      timeout: 5000,
    });
    expect(ip).toBe("1.2.3.4");
  });

  test("should ignore addresses outside valid IPv4 range", async () => {
    const ip = await gip({
      services: [getUrl("/mix-ipv4?1"), getUrl("/mix-ipv4?2"), getUrl("/mix-ipv4?3")],
      ensure: 1,
      timeout: 5000,
    });
    expect(ip).toBe("10.0.0.1");
  });
});
