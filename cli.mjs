#!/usr/bin/env node
':' //; command -v node >/dev/null 2>&1 && exec node "$0" "$@"; command -v bun >/dev/null 2>&1 && exec bun "$0" "$@"; command -v deno >/dev/null 2>&1 && exec deno run "$0" "$@"; echo "Error: Please install node, bun, or deno" >&2; exit 1

import process from "node:process";
import gip from "./module.mjs";
import packageJson from "./package.json" with { type: "json" };

function parseArguments(args) {
  const options = {
    services: [],
  };

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--ensure" || args[i] === "-e") && i + 1 < args.length) {
      const parsed = Number(args[i + 1]);
      if (Number.isNaN(parsed)) {
        console.error(`Error: Invalid value for ensure flag: '${args[i + 1]}'`);
        process.exit(1);
      }
      options.ensure = parsed;
      i++; // Skip the next argument since it's the value for --ensure
    } else if (args[i] === "--services" || args[i] === "-s") {
      // Collect all URLs until the next argument or end of input
      while (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        options.services.push(args[i + 1]);
        i++; // Move to the next URL
      }
    } else if ((args[i] === "--type" || args[i] === "-t") && i + 1 < args.length) {
      const typeArg = args[i + 1];
      if (!["ipv4", "ipv6", "automatic"].includes(typeArg)) {
        console.error(`Error: Invalid value for type flag: '${typeArg}'. Expected "ipv4", "ipv6", or "automatic".`);
        process.exit(1);
      }
      options.type = typeArg;
      i++; // Skip the next argument
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
  const result = await gip({ ...options, verbose: false });
  console.log(result);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
