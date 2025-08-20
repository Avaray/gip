# 🐷 GIP (Get IP)

[GIP](https://www.npmjs.com/package/gip) is a dependency-free, TypeScript-friendly module and
[CLI](https://en.wikipedia.org/wiki/Command-line_interface) tool that uses the
[Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to retrieve your real public
[IPv4](https://en.wikipedia.org/wiki/IPv4) address from "IP echo" services. It fetches data concurrently from multiple services to provide
accurate results as quickly as possible. By default, GIP verifies the IP address by waiting for three matching responses from different
services, and you can customize this number using the `ensure` option.

GIP uses more than 20 different "echo IP" websites, and you can add your own via the `services` option. Since these services are external,
their availability and reliability may vary. To account for this, setting the `ensure` count to a reasonable number is advisable.

GIP uses more than 20 different "echo IP" websites, and you can add your own with the `services` option. Because these services are
external, their availability and reliability may vary. You can reduce risk by choosing a sensible `ensure` count.

## Requirements

[NodeJS](https://nodejs.org/en/download) version **20.0.0** or higher.

## [Module](https://nodejs.org/api/esm.html#modules-ecmascript-modules) installation

[NPM](https://docs.npmjs.com/cli/v10/commands/npm-install)

```bash
npm i gip
```

[PNPM](https://pnpm.io/pnpm-cli#commands)

```bash
pnpm add gip
```

[DENO](https://docs.deno.com/runtime/reference/cli/add/)

```bash
deno add npm:gip
```

[BUN](https://bun.sh/docs/cli/add)

```bash
bun add gip
```

## [Module](https://nodejs.org/api/esm.html#modules-ecmascript-modules) usage

```js
import gip from "gip";

try {
  const ip = await gip();
  console.log(ip);
} catch (error) {
  console.log(`Can't get your IP. Reason: ${error}`);
}
```

Usage with **options**

```js
import gip from "gip";

const options = {
  services: ["ipv4.icanhazip.com", "ifconfig.me/ip"],
  ensure: 10,
};

try {
  const ip = await gip(options);
  console.log(ip);
} catch (error) {
  console.log(`Can't get your IP. Reason: ${error}`);
}
```

## [CLI](https://en.wikipedia.org/wiki/Command-line_interface) installation

[NPM](https://docs.npmjs.com/downloading-and-installing-packages-globally)

```bash
npm i -g gip
```

[PNPM](https://pnpm.io/cli/add#--global--g)

```bash
pnpm add -g gip
```

[DENO](https://docs.deno.com/runtime/reference/cli/install/#global-installation)

```bash
deno i -g npm:gip
```

[BUN](https://bun.sh/docs/cli/install#global-packages)

```bash
bun i -g gip
```

## [CLI](https://en.wikipedia.org/wiki/Command-line_interface) usage

```bash
gip
# 133.74.20.69
```

Setting ensure option

```bash
gip --ensure 10
# 133.74.20.69
```

Passing custom services

```bash
gip --services "https://ipv4.icanhazip.com/" "https://ifconfig.me/ip"
# 133.74.20.69
```

## [CLI](https://en.wikipedia.org/wiki/Command-line_interface) usage without installation

[NPM]()

```bash
npx gip
```

[PNPM](https://pnpm.io/pnpm-cli#commands)

```bash
pnpm dlx gip
```

[DENO](https://docs.deno.com/runtime/reference/cli/run/)

```bash
deno run --allow-net npm:gip
```

[BUN](https://bun.sh/docs/cli/bunx)

```bash
bunx gip
```

## Additional info

- Passing your own services will not prioritize them. You will get answer from the fastest services anyway.
- If you pass service without specified [protocol](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol),
  [HTTPS](https://en.wikipedia.org/wiki/HTTPS) will be used.
- List of built-in services is located in file [services.mjs](https://github.com/Avaray/gip/blob/main/services.mjs). If you know any
  reliable services, feel free to contribute.
