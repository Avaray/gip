// This removes Warning about experimental Fetch API feature
process.removeAllListeners('warning');

const Services = require('./services.json');

const IPv4_regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

module.exports = async function (custom_services = []) {

    custom_services_normalized  = []

    for (const s of custom_services) {
        if (!/^https?:\/\//.test(s)) {
            custom_services_normalized.push(`https://${s}`)
        } else {
            custom_services_normalized.push(s)
        }
    }

    const services = [...new Set([...Services, ...custom_services_normalized])]

    return await Promise.any(services.map(service =>

            fetch(service).then(response => response.text()).then(text => {
                const ip = text.replace(/(\r\n|\n|\r)/gm, '')
                if (IPv4_regex.test(ip)) {
                    return ip
                } else {
                    return Promise.reject(new Error(`${service} doesn't return valid IP address`))
                }
            })
        ))
        .catch(e => {
            throw e
        })
}
