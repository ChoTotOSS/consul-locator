var model = require('./index');

var count = 0

setInterval(() => {
  count++;
  model.User.create({
    firstName: `User ${count}`,
    lastName: "Tran"
  })
}, 5000)
