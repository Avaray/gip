#! /usr/bin/env node

(async()=>{try{console.log(await require('./module.js')(process.argv.slice(2)))}catch{return null}})()
