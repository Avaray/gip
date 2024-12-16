import process from "node:process";
parseInt(process.version.match(/(?:v?)([\d]+)(?:\.)/)[1]) < 21 && process.removeAllListeners("warning");

import services from "./services.mjs";

const IPv4_regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const gip = async ({ services: customServices = [], ensure = 3 } = {}) => {
  for (const [index, s] of customServices.entries()) {
    if (!/^https?:\/\//.test(s)) {
      customServices[index] = `https://${s.replace(/^\W+/g, "")}`;
    }
  }

  const allServices = [...new Set([...services, ...customServices])];

  if (ensure > allServices.length) throw new Error(`Maximum ensure count is ${allServices.length}`);

  // Ensure count must be at least 1
  ensure = Math.max(1, ensure);

  const controller = new AbortController(); // Create an AbortController instance
  const signal = controller.signal; // Get the signal to pass to fetch

  // Map to store IP addresses and their counts
  const ipCounts = new Map();

  const promises = allServices.map((url) =>
    fetch(url, { signal })
      .then((res) => res.text())
      .then((ip) => {
        const trimmedIP = ip.trim();
        if (IPv4_regex.test(trimmedIP)) {
          // Increment count for this IP
          const currentCount = (ipCounts.get(trimmedIP) || 0) + 1;
          ipCounts.set(trimmedIP, currentCount);
          // Check if this IP has reached the ensure count
          if (currentCount === ensure) {
            controller.abort(); // Stop further requests
            return trimmedIP;
          }
        }
        return null;
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Fetch error:", err);
        }
        return null;
      })
  );

  // Wait for all promises to settle
  await Promise.allSettled(promises);

  // Find the IP that matches the ensure count
  for (const [ip, count] of ipCounts.entries()) {
    if (count === ensure) {
      return ip;
    }
  }

  // If no IP meets the ensure count
  throw new Error(`Not enough IP addresses found to meet the ensure count of ${ensure}`);
};

export default gip;
