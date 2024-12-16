#! /usr/bin/env node

import process from "node:process";
import gip from "./module.mjs";
import packageJson from "./package.json" with { type: "json" };

function parseArguments(args) {
  const options = {
    services: [],
  };

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--ensure" || args[i] === "-e") && i + 1 < args.length) {
      options.ensure = Number(args[i + 1]);
      i++; // Skip the next argument since it's the value for --ensure
    } else if (args[i] === "--services" || args[i] === "-s") {
      // Collect all URLs until the next argument or end of input
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        options.services.push(args[i + 1]);
        i++; // Move to the next URL
      }
    } else if (args[i] === "--version" || args[i] === "-v") {
      const version = packageJson.version;
      console.log(version);
      process.exit(0);
    }
  }

  return options;
}

try {
  const options = parseArguments(process.argv.slice(2));
  const result = await gip(options);
  console.log(result);
  process.exit(0);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
