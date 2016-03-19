
"use strict"
var logger = require('log4js').getLogger();

var exorcism = (options) => {
  var consul = require('consul')(options);

  class Service {
    constructor(name) {
      this.name = name
    }

    watch(callback) {
      var watch = consul.watch({
        method: consul.catalog.service.nodes,
        options: {
          service: this.name
        }
      })

      watch.on('change', (data) => {
        logger.info('Service has been changed')
        callback(data)
      });

      watch.on('err', (err) => { throw err })
    }

    watchKey(key, callback) {
      var self = this
      if (!self.kv) self.kv = {}
      var watch = consul.watch({
        method: consul.kv.get,
        options: {
          key: key
        }
      })

      watch.on('change', (data) => {
        if (!data) return logger.warn(`Key '${key}' is not exists`)
        if (self.kv[key] && self.kv[key] == data.Value) {
          return
        }
        self.kv[key] = data.Value
        callback(data.Value)
      })

      watch.on('err', (err) => {
        logger.error(`Failure to get key '${key}' is not exists`)
      })
    }

  }
  return Service
}

module.exports = {
  serviceFor: exorcism
}
