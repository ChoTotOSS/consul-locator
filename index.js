"use strict"
var logger = require('log4js').getLogger();
var async = require('async');
var request = require('request');
var extend = require('extend')

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

var consul = null
var watched = {}
var nodes = {}

module.exports = () => {

  class Service {
    constructor(name) {
      this.name = name
    }

    watch(callback) {
      var self = this
      logger.info(`Discover for service '${this.name}'`)
      var watch = consul.watch({
        method: consul.catalog.service.nodes,
        options: {
          service: this.name
        }
      })

      watch.on('change', (data) => {
        logger.debug(`Service ${self.name} has been changed`)
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

  var use = (options) => {
    consul = require('consul')(options)
  }

  var $http = (uri, options) => {
    return new Promise((resolve, reject) => {
      async.waterfall([
        (next) => {
          var serviceMatched = uri.match(/service:\/\/([a-zA-Z|-]*)/)
          next(null, serviceMatched)
        },
        (serviceMatched, next) => {
          if (!serviceMatched) {
            return next(null, uri)
          }
          inject([serviceMatched[1], ($service) => {
            var url = uri.replace(/service:\/\/([a-zA-Z|-]*)/, `http://${$service.ServiceAddress}:${$service.ServicePort}`)
            if (!$service) {
              return next(`Service ${serviceMatched[1]} is missing`)
            }
            next(null, url)
          }])
        },
        (url, next) => {
          console.log(url)
          var params = request.initParams(url, options, (err, resp, body) => {
            if (err) return next(err)
            next(null, {status: resp.statusCode, response: resp, body: body})
          })
          new request.Request(params)
        }
      ], (err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    })
  }

  var methods = ['get', 'head', 'post', 'put', 'patch', 'del']

  for (var method of methods) {
    $http[method] = ((method) => {
      var method = method === 'del' ? 'DELETE' : method.toUpperCase()
      return (uri, options) => {
        options = extend(options, {method: method})
        return $http(uri, options)
      }
    })(method)
  }



  var inject = (args) => {
    if (!Array.isArray(args)) {
      throw "Wrong args list"
    } else if (typeof args[args.length - 1] !== 'function') {
      throw `Missing injected Function`
    }

    var serviceList = args.slice(0, args.length - 1)
    var next = args[args.length - 1]

    for (var serviceName of serviceList) {
      if (!(serviceName in watched)) {
        var service = new Service(serviceName)
        service.watch((services) => {
          nodes[serviceName] = services
        })
        watched[serviceName] = true
      }
    }

    async.map(serviceList, (serviceName, next) => {
      async.retry({times: 10, interval: 200}, (next) => {
        try {
          next(null, nodes[serviceName].next())
        } catch (e) {
          next(e);
        }
      }, next)
    }, (err, results) => next.apply(err, results))
  }

  return {
    Service: Service,
    inject: inject,
    use: use,
    $http: $http
  }
}()
