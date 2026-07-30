import { describe, test, expect, afterEach } from "bun:test";
import gip from "./module.mjs";
import defaultServices from "./services.mjs";

describe("gip module", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // --- Core behavior ---

  test("should return a valid public IPv4 address", async () => {
    const ip = await gip({ ensure: 2, timeout: 15000 });
    const IPv4_regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    expect(ip).toMatch(IPv4_regex);
  }, 20000);

  test("should resolve instantly and not wait for all fetches to settle", async () => {
    globalThis.fetch = async (url, opts) => {
      // Slow services take 5 seconds, fast services respond immediately
      if (url.includes("ifconfig.me") || url.includes("ipify.org")) {
        await new Promise((r) => setTimeout(r, 5000));
      }
      return new Response("1.2.3.4");
    };

    const start = Date.now();
    const ip = await gip({ ensure: 1, timeout: 10000 });
    const elapsed = Date.now() - start;

    expect(ip).toBe("1.2.3.4");
    // Should resolve well before the slow mocks would respond
    expect(elapsed).toBeLessThan(2000);
  });

  // --- ensure option ---

  test("should require ensure count matching IPs before resolving", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      // All return the same IP; we verify ensure:3 waits for 3 responses
      return new Response("5.5.5.5");
    };

    const ip = await gip({ ensure: 3, timeout: 5000 });
    expect(ip).toBe("5.5.5.5");
    expect(callCount).toBeGreaterThanOrEqual(3);
  });

  test("should throw if ensure count exceeds total number of services", async () => {
    const totalServices = defaultServices.ipv4.length + defaultServices.ipv6.length;
    await expect(
      gip({ ensure: totalServices + 1 })
    ).rejects.toThrow(/Maximum ensure count/);
  });

  // --- Type handling ---

  test("should resolve IPv6 address when type is ipv6", async () => {
    globalThis.fetch = async () => new Response("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    
    // We pass a custom service just so it has something to fetch (since defaultServices.ipv6 is empty currently)
    const ip = await gip({ services: ["ipv6.test"], ensure: 1, type: "ipv6", timeout: 2000 });
    expect(ip).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
  });

  test("should ignore IPv4 address when type is ipv6", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount < 2) return new Response("1.2.3.4");
      return new Response("::1");
    };

    const ip = await gip({ services: ["ipv6.test1", "ipv6.test2"], ensure: 1, type: "ipv6", timeout: 2000 });
    expect(ip).toBe("::1");
  });

  test("should resolve first matched type (IPv6) when type is automatic", async () => {
    globalThis.fetch = async () => new Response("2001:0db8::1");
    
    const ip = await gip({ services: ["auto.test"], ensure: 1, type: "automatic", timeout: 2000 });
    expect(ip).toBe("2001:0db8::1");
  });

  // --- Services URL formatting ---

  test("should prepend https:// to custom services without a protocol", async () => {
    const receivedUrls = [];
    globalThis.fetch = async (url) => {
      receivedUrls.push(url);
      return new Response("7.7.7.7");
    };

    await gip({
      services: ["myip.example.com", "///another.example.com"],
      ensure: 1,
      timeout: 2000,
    });

    const customUrls = receivedUrls.filter((u) => u.includes("example.com"));
    for (const url of customUrls) {
      expect(url).toMatch(/^https:\/\//);
    }
  });

  test("should not mutate the original services array passed by the caller", async () => {
    globalThis.fetch = async () => new Response("8.8.8.8");

    const myServices = ["no-protocol.example.com"];
    const original = [...myServices];

    await gip({ services: myServices, ensure: 1, timeout: 2000 });

    expect(myServices).toEqual(original);
  });

  // --- Error cases ---

  test("should throw if no valid IP is found within the timeout", async () => {
    globalThis.fetch = async (url, opts) => {
      // Honour the AbortSignal so gip's controller can cancel this mock
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 5000);
        opts?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(Object.assign(new Error("The operation was aborted"), { name: "AbortError" }));
        });
      });
      return new Response("1.2.3.4");
    };

    await expect(
      gip({ ensure: 1, timeout: 100 })
    ).rejects.toThrow(/No valid IP addresses found within/);
  });

  test("should ignore responses that are not valid IPv4 addresses", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount < 5) return new Response("not-an-ip");
      return new Response("9.9.9.9");
    };

    const ip = await gip({ ensure: 1, timeout: 5000 });
    expect(ip).toBe("9.9.9.9");
  });

  test("should ignore addresses outside valid IPv4 range", async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount++;
      if (callCount < 3) return new Response("999.999.999.999");
      return new Response("10.0.0.1");
    };

    const ip = await gip({ ensure: 1, timeout: 5000 });
    expect(ip).toBe("10.0.0.1");
  });
});
