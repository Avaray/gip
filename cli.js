#! /usr/bin/env node

const IP = require('./module.js');

(async () => {
    try {
        let ip = await IP(process.argv.slice(2))
        console.log(ip)
    } catch {
        return null
    }
})()
