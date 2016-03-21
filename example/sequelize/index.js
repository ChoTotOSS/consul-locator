var Sequelize = require('sequelize');
var path = require('path');
var root = path.dirname(require.main.filename);
var Service = require('../../index').serviceFor({host:'192.168.99.100'})

var service = new Service('postgres')
models = {}
service.watch((services) => {
  if (!services.isEmpty()) {
    var postgres = services.get()
    var sequelize = new Sequelize('testdb', 'postgres', 'khongbiet', {
      host: postgres.ServiceAddress,
      port: postgres.ServicePort,
      dialect: 'postgres',
    })
    require('fs').readdirSync(root).forEach(function(file) {
    	var modelName = file.split('.')[0];
      if (modelName !== 'index' && modelName !== 'test') {
        models[modelName] = require(`./${modelName}`)(sequelize);
      }
    })
  } else {
    console.warn('Service has been down')
  }
})

module.exports = models
