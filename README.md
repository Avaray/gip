# 🐷 GIP (Get IP)

[GIP](https://www.npmjs.com/package/gip) is a [Node.js](https://nodejs.org/en/) module and CLI tool for getting your Public [IPv4](https://en.wikipedia.org/wiki/IPv4) address using popular (or less popular) "IP echo" services. Dependency free. Created with newest feature of Node.js - [Fetch API](https://nodejs.org/en/blog/release/v18.0.0/).  

It will fetch data from multiple services at the same time to give you results as fast as possible.

## Requirements
[NodeJS](https://nodejs.org/en/download) version **18.0.0** or higher.  
Alternatively version higher than **17.5.0** with `--experimental-fetch` flag.

## Usage
Installation:  
`npm i gip` or `pnpm add gip`

Example code:  
````js
const gip = require('gip'); 

(async () => {
    try {
        const ip = await gip()
        console.log(ip)
    } catch (error) {
        console.log(`Can't get your IP. Reason: ${error}`)
    }
})()
````

## CLI installation
`npm i -g gip` or `pnpm add -g gip`

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

Passing your own services will not prioritize them. You will get answer from the fastest service anyway.
