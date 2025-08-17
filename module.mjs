import process from "node:process";
parseInt(process.version.match(/(?:v?)([\d]+)(?:\.)/)[1]) < 21 && process.removeAllListeners("warning");

import services from "./services.mjs";

const IPv4_regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const gip = async ({ services: customServices = [], ensure = 3, timeout = 10000 } = {}) => {
  for (const [index, s] of customServices.entries()) {
    if (!/^https?:\/\//.test(s)) {
      customServices[index] = `https://${s.replace(/^\W+/g, "")}`;
    }
  }

  const allServices = [...new Set([...services, ...customServices])];

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

  const promises = allServices.map((url) =>
    fetch(url, { signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((ip) => {
        const trimmedIP = ip.trim();
        if (IPv4_regex.test(trimmedIP) && !isResolved) {
          // Increment count for this IP
          const currentCount = (ipCounts.get(trimmedIP) || 0) + 1;
          ipCounts.set(trimmedIP, currentCount);
          
          // Check if this IP has reached the ensure count
          if (currentCount === ensure && !firstValidIP) {
            firstValidIP = trimmedIP; // Mark as the first valid IP
            isResolved = true;
            clearTimeout(timeoutId); // Clear timeout
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

  try {
    // Wait for all promises to settle
    await Promise.allSettled(promises);
  } finally {
    // Always clear timeout
    clearTimeout(timeoutId);
  }

  // Return the first IP that reached the ensure count
  if (firstValidIP) {
    return firstValidIP;
  }

  // If no IP meets the ensure count, provide detailed error
  const ipResults = Array.from(ipCounts.entries())
    .map(([ip, count]) => `${ip}(${count})`)
    .join(', ');
  
  const errorMessage = ipResults 
    ? `Not enough IP addresses found to meet ensure count of ${ensure}. Found: ${ipResults}`
    : `No valid IP addresses found within ${timeout}ms timeout`;
    
  throw new Error(errorMessage);
};

export default gip;
