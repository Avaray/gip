import http from "node:http";
import https from "node:https";
import services from "../services.mjs";

const IPv4_regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPv6_regex = /^(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

const TIMEOUT = 5000;

function checkService(url, type) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith("https:");
    const client = isHttps ? https : http;
    const family = type === "ipv4" ? 4 : 6;
    
    let isSettled = false;
    
    const req = client.get(url, { family, headers: { "User-Agent": "curl/7.68.0" } }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        if (!isSettled) { isSettled = true; resolve({ url, ok: false, error: `HTTP ${res.statusCode}` }); }
        return;
      }
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (isSettled) return;
        isSettled = true;
        const ip = data.trim();
        const regex = type === "ipv4" ? IPv4_regex : IPv6_regex;
        if (regex.test(ip)) {
          resolve({ url, ok: true, ip });
        } else {
          resolve({ url, ok: false, error: `Wrong format: ${ip.substring(0, 50)}` });
        }
      });
    });

    req.on("error", (err) => {
      if (!isSettled) { isSettled = true; resolve({ url, ok: false, error: err.message }); }
    });

    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      if (!isSettled) { isSettled = true; resolve({ url, ok: false, error: "Timeout" }); }
    });
  });
}

async function run() {
  console.log("Checking IPv4 services...");
  const ipv4Results = await Promise.all(services.ipv4.map(url => checkService(url, "ipv4")));
  
  let ipv4Success = 0;
  for (const res of ipv4Results) {
    if (res.ok) {
      console.log(`\x1b[32m[OK]\x1b[0m ${res.url.padEnd(45)} -> ${res.ip}`);
      ipv4Success++;
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${res.url.padEnd(45)} -> ${res.error}`);
    }
  }
  console.log(`\nIPv4 Summary: ${ipv4Success} / ${services.ipv4.length} passed\n`);

  console.log("Checking IPv6 services...");
  const ipv6Results = await Promise.all(services.ipv6.map(url => checkService(url, "ipv6")));
  
  let ipv6Success = 0;
  for (const res of ipv6Results) {
    if (res.ok) {
      console.log(`\x1b[32m[OK]\x1b[0m ${res.url.padEnd(45)} -> ${res.ip}`);
      ipv6Success++;
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m ${res.url.padEnd(45)} -> ${res.error}`);
    }
  }
  console.log(`\nIPv6 Summary: ${ipv6Success} / ${services.ipv6.length} passed\n`);
}

run();
