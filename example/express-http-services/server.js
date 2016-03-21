var express = require('express')
var Server = require('http').Server
var bodyParser = require('body-parser')
var request = require('request')

var exampleService = require('./example-service')


var logger = require('log4js').getLogger()

// Set up app
var app = express()
var http = Server(app)

app.use(bodyParser.json())

app.get('/hello', (req, res) => {
  var serv = exampleService.next()
  request.get(`http://${serv.ServiceAddess}:${serv.ServicePort}/endpoint`, (err, data, res) => {
    res.end(data)
  })
})


http.listen(3000, () => {

  //Set up logger
  logger.info('Setup logger')
  logger.setLevel(process.env.LOG_LEVEL || 'INFO')
  logger.info('Server run on 3000')
})
