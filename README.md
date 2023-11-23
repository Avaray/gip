# 🐷 GIP (Get IP)

[GIP](https://www.npmjs.com/package/gip) is a [Node.js](https://nodejs.org/en/) dependency-free tool for getting your Public [IPv4](https://en.wikipedia.org/wiki/IPv4) address using "IP echo" services. It will fetch data from multiple services at the same time to give you results as fast as possible.

## Requirements
[NodeJS](https://nodejs.org/en/download) version **18.0.0** or higher, becuse of [Fetch API](https://nodejs.org/en/blog/release/v18.0.0/). 

## Installation
Using [NPM](https://docs.npmjs.com/cli/v10/commands/npm-install)
```bash
npm i gip
```

Using [PNPM](https://pnpm.io/pnpm-cli#commands)
```bash
pnpm add gip
```

## Usage
````js
import gip from 'gip'

(async () => {
    try {
        const ip = await gip()
        console.log(ip)
    } catch (error) {
        console.log(`Can't get your IP. Reason: ${error}`)
    }
})()
````

Usage with custom services:  
````js
import gip from 'gip'

const my_services = ['https://ipv4.icanhazip.com/', 'ifconfig.me/ip']

(async () => {
    try {
        const ip = await gip(my_services)
        console.log(ip)
    } catch (error) {
        console.log(`Can't get your IP. Reason: ${error}`)
    }
})()
````

## [CLI](https://en.wikipedia.org/wiki/Command-line_interface) installation
Using [NPM](https://docs.npmjs.com/cli/v10/commands/npm-install)
```bash
npm i -g gip
```

Using [PNPM](https://pnpm.io/pnpm-cli#commands)
```bash
pnpm add -g gip
```

## CLI usage
````bash
gip
# 133.74.20.69
````

Usage with custom services:  
````bash
gip "https://ipv4.icanhazip.com/" "https://ifconfig.me/ip"
# 133.74.20.69

gip ipv4.icanhazip.com ifconfig.me/ip
# 133.74.20.69
````

## Additional info

- Passing your own services will not prioritize them. You will get answer from the fastest service anyway. List of services is located in file [services.json](https://github.com/Avaray/gip/blob/main/services.json)

- If you pass service without specified [protocol](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol) - [GIP](https://www.npmjs.com/package/gip) will treat it as [HTTPS](https://en.wikipedia.org/wiki/HTTPS)
