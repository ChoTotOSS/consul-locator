var Sequelize = require('sequelize');
var path = require('path');
var root = path.dirname(require.main.filename);
var Service = require('../../index').serviceFor({host:'192.168.99.100'})

var service = new Service('postgres')
models = {}
service.watch((data) => {
  if (data.length > 0) {
    var sequelize = new Sequelize('testdb', 'postgres', 'khongbiet', {
      host: data[0].ServiceAddress,
      port: data[0].ServicePort,
      dialect: 'postgres',
    })
    require('fs').readdirSync(root).forEach(function(file) {
    	var modelName = file.split('.')[0];
      if (modelName !== 'index' && modelName !== 'test') {
        models[modelName] = require(`./${modelName}`)(sequelize);
      }
    })
  } else {
    console.log('NO DATA')
  }
})

module.exports = models
