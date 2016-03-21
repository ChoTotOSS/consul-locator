"use strict"
var logger = require('log4js').getLogger();

class ServiceFactory {
  constructor(data) {
    this.data = data
    this.index = -1
  }

  next() {
    this.index = ++this.index % this.data.length
    return this.data[this.index]
  }

  isEmpty() {
    return this.data.length < 1
  }

  [Symbol.iterator]() {
    return new ArrayIterator(this.data)
  }
}

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
        logger.debug('Service has been changed')
        var services = new ServiceFactory(data)
        callback(services)
      });

      watch.on('err', (err) => { throw err })
    }

    subscribe(key, callback) {
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
