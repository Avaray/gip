import process from "node:process";
parseInt(process.version.match(/(?:v?)([\d]+)(?:\.)/)[1]) < 21 && process.removeAllListeners("warning");

import services from "./services.mjs";

const IPv4_regex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const gip = async (customServices = []) => {
  customServices.forEach((s, index) => {
    !/^https?:\/\//.test(s) && (customServices[index] = `https://${s.replace(/^\W+/g, "")}`);
  });

  const allServices = [...new Set([...services, ...customServices])];

  try {
    return await Promise.any(
      allServices.map(async (service) => {
        const response = await fetch(service);
        const text = await response.text();
        const ip = text.replace(/[^\d\.]*/gm, "");
        if (IPv4_regex.test(ip)) {
          return ip;
        } else {
          return Promise.reject(new Error(`${service} doesn't return valid IP address`));
        }
      }),
    );
  } catch {
    throw new Error("Unable to fetch a valid IP address from any service");
  }
};

export default gip;
