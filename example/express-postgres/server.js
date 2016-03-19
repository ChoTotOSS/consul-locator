var express = require('express');
var Server = require('http').Server;
var bodyParser = require('body-parser');
var Sequelize = require('../sequelize');

var Service = require('consul-locator').serviceFor({
  host: '127.0.0.1',
  port: 8500
})

var logger = require('log4js').getLogger();

// Set up app
var app = express();
var http = Server(app);

app.use(bodyParser.json());

app.get('/hello', (req, res) => {

});

http.listen(3000, () => {

  //Set up logger
  logger.info('Setup logger');
  logger.setLevel(process.env.LOG_LEVEL || 'INFO');
  logger.info('Server run on 3000');
});
