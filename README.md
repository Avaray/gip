# 🐷 GIP (Get IP)

[GIP](https://www.npmjs.com/package/gip) is a [Node.js](https://nodejs.org/en/) module and CLI tool for getting your Public [IPv4](https://en.wikipedia.org/wiki/IPv4) address using popular (or less popular) "IP echo" services. Dependency free. Created with newest feature of Node.js - [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).  

It will fetch data from multiple services at the same time to give you results as fast as possible.

## Usage
`npm i gip`

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

## CLI usage
Installation:  
`npm i -g gip`

Usage:  
`> gip`

Usage with custom services:  
`> gip "https://ipv4.icanhazip.com/" "https://ifconfig.me/ip"`  
Currently you need to pass full, valid URL (including protocol). It will change in next version(s).

## Requirements
Node.js version 18.0.0 or higher.
