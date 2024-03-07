const { validateSignup } = require('../middleware')
const { signUp } = require('../controllers')


const routes = app => {
  app.post('/signup', [ validateSignup, signUp ])
}


module.exports = routes