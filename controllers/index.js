/* controllers/index.js */

const signUp = require('./signup')
const signIn = require('./signin')
const signOut = require('./signout')
const { public, private } = require('./content')

module.exports = {
  signUp,
  signIn,
  signOut,
  public,
  private
}