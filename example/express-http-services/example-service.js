var request = require('request');
var locator = require('consul-locator')
locator.use({
  host: '127.0.0.1',
  port: 8500
})

var service = new locator.Service('example-services')

service.watch((services) => {
  module.exports = services
})
