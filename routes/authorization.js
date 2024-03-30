/* routes/authorization.js */

const {
  validateSignup
} = require('../middleware')
const {
  signUp,
  signIn,
  signOut
} = require('../controllers')


const routes = app => {
  app.post('/signup', validateSignup, signUp)
  app.post('/signin', signIn)
  app.post('/signout', signOut)
}


module.exports = routes