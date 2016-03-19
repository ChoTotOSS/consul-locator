var express = require('express');
var Server = require('http').Server;
var bodyParser = require('body-parser');
var Sequelize = require('sequelize');

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

  logger.info('Init discovery service');

  var postgres = new Service('postgres');

  postgres.watch((data) {

    if (data.length < 1) {
      throw 'No postgres is available'
    }
    var db = data[0];
    // Connect to 1st node, assume the data.length is > 1
    var sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER ,
        process.env.DB_PASSWORD,
        {
          host: db.ServiceAddress,
          port: db.ServicePort
        }
    )

    // Then do restart server
    //Init hot reload here
  })

  logger.info('Server run on 3000');
});
