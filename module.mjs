import process from "node:process";
import http from "node:http";
import https from "node:https";
parseInt(process.version.match(/(?:v?)([\d]+)(?:\.)/)[1]) < 21 && process.removeAllListeners("warning");

import services from "./services.mjs";

const IPv4_regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const IPv6_regex =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

const fetchIP = (urlStr, options = {}) => {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(urlStr);
    } catch (e) {
      return reject(e);
    }

    // NOTE: Do NOT pass `signal` to reqOptions — Bun does not support it in
    // http.get() and will silently hang. Aborting is handled manually below.
    const client = url.protocol === "http:" ? http : https;
    const reqOptions = {
      family: options.family,
    };

    let settled = false;
    const done = (fn, val) => {
      if (settled) return;
      settled = true;
      fn(val);
    };

    const req = client.get(url, reqOptions, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return done(reject, new Error(`HTTP ${res.statusCode}`));
      }

      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => done(resolve, data));
    });

    if (options.signal) {
      const abortErr = () => {
        const err = new Error("AbortError");
        err.name = "AbortError";
        done(reject, err);
        req.destroy();
      };

      if (options.signal.aborted) {
        abortErr();
      } else {
        options.signal.addEventListener("abort", abortErr);
        req.on("close", () => options.signal.removeEventListener("abort", abortErr));
      }
    }

    req.on("error", (err) => done(reject, err));
  });
};

const gip = async ({ services: customServices = [], ensure = 3, timeout = 10000, verbose = true, type = "automatic" } = {}) => {
  const formattedCustomServices = customServices.map((s) =>
    /^https?:\/\//.test(s) ? s : `https://${s.replace(/^\W+/g, "")}`
  );

  let selectedServices = [];
  let family = 0;
  if (type === "ipv4") {
    selectedServices = services.ipv4;
    family = 4;
  } else if (type === "ipv6") {
    selectedServices = services.ipv6;
    family = 6;
  } else if (type === "automatic") {
    selectedServices = [...services.ipv4, ...services.ipv6];
    family = 0;
  } else {
    throw new Error(`Invalid type parameter: ${type}. Expected "ipv4", "ipv6", or "automatic"`);
  }

  const allServices = [...new Set([...selectedServices, ...formattedCustomServices])];

  if (ensure > allServices.length) throw new Error(`Maximum ensure count is ${allServices.length}`);

  // Ensure count must be at least 1
  ensure = Math.max(1, ensure);

  const controller = new AbortController();
  const signal = controller.signal;

  // Global timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  // Map to store IP addresses and their counts
  const ipCounts = new Map();

  // Track the first IP to reach the ensure count (edge case handling)
  let firstValidIP = null;
  let isResolved = false;

  return new Promise((resolve, reject) => {
    const promises = allServices.map((url) =>
      fetchIP(url, { signal, family })
        .then((ip) => {
          const trimmedIP = ip.trim();
          let isValid = false;
          if ((type === "ipv4" || type === "automatic") && IPv4_regex.test(trimmedIP)) isValid = true;
          if ((type === "ipv6" || type === "automatic") && IPv6_regex.test(trimmedIP)) isValid = true;

          if (isValid && !isResolved) {
            // Increment count for this IP
            const currentCount = (ipCounts.get(trimmedIP) || 0) + 1;
            ipCounts.set(trimmedIP, currentCount);

            // Check if this IP has reached the ensure count
            if (currentCount === ensure && !firstValidIP) {
              firstValidIP = trimmedIP; // Mark as the first valid IP
              isResolved = true;
              clearTimeout(timeoutId); // Clear timeout
              controller.abort(); // Stop further requests
              resolve(trimmedIP); // Resolve immediately!
              return trimmedIP;
            }
          }
          return null;
        })
        .catch((err) => {
          if (err.name !== "AbortError" && verbose) {
            console.error(`[gip] fetch error (${url}): ${err.message}`);
          }
          return null;
        })
    );

    Promise.allSettled(promises).then(() => {
      if (!isResolved) {
        clearTimeout(timeoutId);
        const ipResults = Array.from(ipCounts.entries())
          .map(([ip, count]) => `${ip}(${count})`)
          .join(", ");

        const errorMessage = ipResults
          ? `Not enough IP addresses found to meet ensure count of ${ensure}. Found: ${ipResults}`
          : `No valid IP addresses found within ${timeout}ms timeout`;

        reject(new Error(errorMessage));
      }
    });
  });
};

export default gip;
