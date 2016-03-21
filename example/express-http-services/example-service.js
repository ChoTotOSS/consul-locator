var request = require('request');

var Service = require('consul-locator').serviceFor({
  host: '127.0.0.1',
  port: 8500
})

var service = new Service('example-services')

service.watch((services) => {
  module.exports = services
})
