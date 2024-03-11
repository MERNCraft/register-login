const validateSignup = require('./validateSignup')
const { makeToken } = require('./jwToken')

module.exports = {
  validateSignup,
  makeToken
}