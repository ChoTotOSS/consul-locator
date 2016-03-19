
"use strict"
var consul = require('consul')();
var logger = require('log4js').getLogger();

var exorcism = (consulHost, consulPort) => {
  var consul = require('consul')({host: consulHost, port: consulPort});

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

var Serv = exorcism()

var service = new Serv('hello-world');
service.watch((data) => {
  console.log(data);
})

service.watchKey('blah', (value) => {
  logger.debug(`Key has been changed`)
  console.log(value)
})

module.exports = {
  serviceFor: exorcism
}
