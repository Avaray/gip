#! /usr/bin/env node

import gip from "./module.mjs";
import process from "node:process";

try {
  console.log(await gip(process.argv.slice(2)));
  process.exit(0);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
