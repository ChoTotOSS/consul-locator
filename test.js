var Service = require('./index.js').serviceFor()
var consul = require('consul')()
var expect = require('chai').expect
var logger = require('log4js').getLogger()
var sinon = require('sinon')

logger.setLevel('OFF')

describe('Service', () => {

  var serviceInfo = {
    name: 'test-service',
    id: 'test-service'
  }

  describe('Discover a service', () => {
    var service = new Service(`test-service`);
    it('Watch register', (done) => {
      var spy = sinon.spy();
      service.watch(spy)
      consul.agent.service.register('test-service', (err) => {
        expect(spy.called).to.equal(true);
        done()
      })
    })

    it('Watch deregister', (done) => {
      var spy = sinon.spy();
      service.watch(spy)
      consul.agent.service.register('test-service', (err) => {
        expect(spy.called).to.equal(true);
        done()
      })
    })

    it('Should watch key assignment', (done) => {
      var spy = sinon.spy()
      service.subscribe('test/tcp/port', spy)
      consul.kv.set('test/tcp/port', 8000, (err) => {
        expect(spy.called).to.equal(true);
        done()
      })
    })
  })
})
