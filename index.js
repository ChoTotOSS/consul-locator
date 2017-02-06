"use strict"
var logger = require('log4js').getLogger('consul');
var async = require('async');
var request = require('request');
var extend = require('extend')
var urllib = require('url')

logger.setLevel(process.env.CONSUL_LOCATOR || 'INFO')

class ServiceFactory {
  constructor(data) {
    this.data = data
    this.index = -1
  }

  next() {
    if (this.isEmpty()) return null
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

module.exports = (() => {

  class Service {
    constructor(name) {
      this.name = name
      if (!consul) {
        throw `Misisng consul info, run locator.use please`
      }
      this.consul = consul
    }

    watch(callback) {
      var self = this
      logger.info(`Discover for service '${this.name}'`)
      var watch = this.consul.watch({
        method: this.consul.health.service,
        options: {
          service: this.name,
          passing: true
        }
      })

      watch.on('change', (data) => {
        logger.debug(`Service ${self.name} has been changed`, data)
        var services = new ServiceFactory(data)
        callback(services)
      });

      watch.on('err', (err) => { throw err })
    }

    subscribe(key, callback) {
      var self = this
      if (!self.kv) self.kv = {}
     var watch = this.consul.watch({
        method: this.consul.kv.get,
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
          var uriObj = urllib.parse(uri)
          next(null, uriObj)
        },
        (uriObj, next) => {
          if (!consul) {
            return next(null, uri.replace('service:', 'http:'))
          }

          if (uriObj.protocol != 'service:') {
            return next(null, uri)
          }
          inject([uriObj.host, ($service) => {
            if (!$service) {
              return next(`Service ${uriObj.host} is missing`)
            }
            var url = `http://${$service.Service.Address}:${$service.Service.Port}${uriObj.path}`
            next(null, url)
          }])
        },
        (url, next) => {
          logger.debug(`Make a request to ${url}`)
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
          var node = nodes[serviceName].next()
          next(null, node)
        } catch (e) {
          next(e);
        }
      }, next)
    }, (err, results) => next.apply(null, results))
  }

  return {
    Service: Service,
    inject: inject,
    use: use,
    $http: $http
  }
})()
