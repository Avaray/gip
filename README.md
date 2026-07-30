# 🐷 GIP (Get IP)

Dependency-free, [TypeScript](https://www.typescriptlang.org/)-friendly module and
[CLI](https://en.wikipedia.org/wiki/Command-line_interface) tool that retrieves your real public
[IPv4](https://en.wikipedia.org/wiki/IPv4) or [IPv6](https://en.wikipedia.org/wiki/IPv6) address from "IP echo" services.
It uses the built-in [`node:http`](https://nodejs.org/api/http.html) / [`node:https`](https://nodejs.org/api/https.html) modules
and enforces the IP family at the DNS-resolution level (`family: 4` or `family: 6`), so you always get the address type you asked for.
Requests are fired concurrently to multiple services, and by default **GIP** waits for three matching responses before returning a result.
You can customize this threshold with the `ensure` option.

**GIP** uses more than 20 different "IP echo" websites split into dedicated IPv4 and IPv6 lists, and you can add your own with the
`services` option. Because these services are external, their availability and reliability may vary. You can reduce risk of failure by choosing
a sensible `ensure` count.

## Requirements

[NodeJS](https://nodejs.org/en/download) version **20.0.0** or higher.

## [Module](https://nodejs.org/api/esm.html#modules-ecmascript-modules) installation

Use your favorite package manager to install **GIP** as a dependency in your project:

```sh
# with NPM
npm i gip

# with PNPM
pnpm add gip

# with Bun
bun add gip

# with Deno
deno add npm:gip
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
  verbose: true,
  type: "ipv4",
};

try {
  const ip = await gip(options);
  console.log(ip);
} catch (error) {
  console.log(`Can't get your IP. Reason: ${error}`);
}
```

## [CLI](https://en.wikipedia.org/wiki/Command-line_interface) installation

```sh
# with NPM
npm i -g gip

# with PNPM
pnpm add -g gip

# with Bun
bun i -g gip

# with Deno
deno i -g npm:gip
```

## [CLI](https://en.wikipedia.org/wiki/Command-line_interface) usage

```sh
gip
# 133.74.20.69
```

Setting ensure option

```sh
gip --ensure 10
# 133.74.20.69
```

Setting type option

```sh
gip --type ipv6
# 2001:0db8:85a3:0000:0000:8a2e:0370:7334
```

Passing custom services

```sh
gip --services "https://ipv4.icanhazip.com/" "https://ifconfig.me/ip"
# 133.74.20.69
```

## [CLI](https://en.wikipedia.org/wiki/Command-line_interface) usage without installation

[NPM](https://docs.npmjs.com/cli/v11/commands/npx)

```sh
# with NPM
npx gip

# with PNPM
pnx gip

# with Bun
bunx gip

# with Deno
deno run --allow-net npm:gip
```

## Additional info

- Passing your own services will not prioritize them. You will get the answer from the fastest responding service anyway.
- If you pass a service without a specified [protocol](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol),
  [HTTPS](https://en.wikipedia.org/wiki/HTTPS) will be used.
- IP family enforcement (`family: 4` / `family: 6`) is applied at the DNS-resolution level via `node:http` / `node:https`.
  This means even dual-stack (IPv4 + IPv6) domains are forced to resolve using the correct address family.
- Lists of built-in services are located in [services.mjs](https://github.com/Avaray/gip/blob/main/services.mjs). If you know any
  reliable services, feel free to contribute.
