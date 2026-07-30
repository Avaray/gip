# 🐷 GIP (Get IP)

Dependency-free, [TypeScript](https://www.typescriptlang.org/)-friendly module and
[CLI](https://en.wikipedia.org/wiki/Command-line_interface) tool to quickly retrieve your real public [IPv4](https://en.wikipedia.org/wiki/IPv4) or [IPv6](https://en.wikipedia.org/wiki/IPv6) address. 

## [Module](https://nodejs.org/api/esm.html#modules-ecmascript-modules) installation

Use your favorite package manager to install **GIP** as a dependency in your project:

```sh
# with NPM
npm install gip

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
npm install -g gip

# with PNPM
pnpm add -g gip

# with Bun
bun install -g gip

# with Deno
deno install -g npm:gip
```

## [CLI](https://en.wikipedia.org/wiki/Command-line_interface) usage

```sh
gip
# 133.74.20.69

gip --ensure 10
# 133.74.20.69

gip --type ipv6
# 2001:0db8:85a3:0000:0000:8a2e:0370:7334

gip --services "https://ipv4.icanhazip.com/" "https://ifconfig.me/ip"
# 133.74.20.69
```

## [CLI](https://en.wikipedia.org/wiki/Command-line_interface) usage without installation

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

## License

[MIT License](LICENSE)
