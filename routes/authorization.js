const {
  validateSignup
} = require('../middleware')
const {
  signUp,
  signIn
} = require('../controllers')


const routes = app => {
  app.post('/signup', [ validateSignup, signUp ])

  app.post('/signin', signIn )
}


module.exports = routes