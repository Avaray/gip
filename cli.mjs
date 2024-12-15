#! /usr/bin/env node

import gip from "./module.mjs";

try {
  console.log(await gip(process.argv.slice(2)))
  process.exit(0)
} catch (error) {
  console.log(console.error(error));
  process.exit(1)
}
