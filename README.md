# consul-locator

This is consul wrapper for discovery and detect a service changed.

Usage:

    var locator = require('consul-locator')

### use

Initialize a new locator wrapper

    locator.use({host: '127.0.0.1'})

Options

* host (String, default: 127.0.0.1): agent address
* port (String, default: 8500): agent HTTP(S) port
* secure (Boolean, default: false): enable HTTPS
* ca (String[], optional): array of strings or Buffers of trusted certificates in PEM format
* defaults (Object, optional): default options for method calls
* promisify (Boolean|Function, optional): convert callback methods to promises


### Service(serviceOptions)

Discovery a service

Options

* service (String): service name
* dc (String, optional): datacenter (defaults to local for agent)
* tag (String, optional): filter by tag

    var service = new locator.Service('hello-world')

Methods:
* watch: Listen to service changed
* subscribe: subscribe to a key and listen to key changed

#### watch(callback)

    sevice.watch((services) => {
        //Do with changed data
        console.log(services.next())
    })

#### subscribe(key, callback)

    service.subscribe('hello/tcp/port', (value) => {
      // Do something with changed value of key `hello/tcp/port`
      console.log(`tcp port has been changed to ${value}`)
    });

### ServiceFactory(serviceData)

#### next()

Get service by circular


    /*
     * services = [10.0.0.1:123, 10.0.0.2:234]
     *
     */
    services.next().ServiceAddress // 10.0.0.1:123
    services.next().ServiceAddress // 10.0.0.2:234

#### isEmpty()

Check is services list is empty

    services.isEmpty()

#### Iterator over services


    for(var service of services) {
      console.log(service)
    }


#### locator.inject

Inject service as a query

    locator.inject(['push-api', 'sms-api', (push_api, sms_api) => {
      console.log(push_api.ServiceAddess) // example: 10.60.3.32
    }])

#### locator.$http

The http client wrapper for request API, It's working like request lib, but has some difference, the uri input could be like `service://service-name/api/path`

    $http.get('service://hydra-web-api/users/17/online').then((res) => {
      console.log(res.status) // http status code
      console.log(res.body) // http response body
      console.log(res.response) // full response object
    })

    var data = {message: 'hello world'}
    $http.post('service://hydra-web-api/users/17/messages', {
      headers: {
        'Authorization': 'd2226611-4ea8-40b8-a3ff-b789862ed522',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then((res) => {
      console.log(res.status)
    }).catch((error) => {
      console.log(error)
    })
