import process from "node:process";
parseInt(process.version.match(/(?:v?)([\d]+)(?:\.)/)[1]) < 21 && process.removeAllListeners("warning");

import services from "./services.mjs";

const IPv4_regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const gip = async ({ services: customServices = [], ensure: ensureCount = 3 } = {}) => {
  for (const [index, s] of customServices.entries()) {
    if (!/^https?:\/\//.test(s)) {
      customServices[index] = `https://${s.replace(/^\W+/g, "")}`;
    }
  }

  const allServices = [...new Set([...services, ...customServices])];

  if (ensureCount > allServices.length) {
    throw new Error(`Maximum ensure count is ${allServices.length}`);
  }

  const controller = new AbortController(); // Create an AbortController instance
  const signal = controller.signal; // Get the signal to pass to fetch

  let resolvedCount = 0;
  let validIP = null; // Variable to hold the valid IP address

  // Create an array of fetch promises
  const promises = allServices.map((url) =>
    fetch(url, { signal }) // Pass the signal to fetch
      .then((res) => res.text())
      .then((ip) => {
        if (IPv4_regex.test(ip.trim())) {
          resolvedCount++;
          validIP = ip.trim(); // Store the valid IP address
          // console.log(`Resolved IP: ${validIP}`);

          // Check if we need to stop fetching based on ensureCount
          if (ensureCount === 0) {
            // console.log(`At least one IP received, stopping further requests.`);
            controller.abort(); // Abort all ongoing requests
            return validIP; // Return the valid IP address immediately
          }

          // Check if the required count of resolved promises is achieved
          if (resolvedCount === ensureCount) {
            // console.log(`Required count of ${ensureCount} achieved with resolved IPs.`);
            controller.abort(); // Abort all ongoing requests
            return validIP; // Return the valid IP address
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Fetch error:", err); // Log other errors
        }
      })
  );

  // Use Promise.allSettled to wait for all promises to settle
  await Promise.allSettled(promises);

  // If we have reached here without returning a valid IP, throw an error
  if (resolvedCount < ensureCount && ensureCount > 0) {
    throw new Error(`Cannot confirm IP. Ensure count: ${ensureCount}, Received count: ${resolvedCount}`);
  }

  return validIP; // Return the last valid IP found or null if none were found
};

export default gip;
