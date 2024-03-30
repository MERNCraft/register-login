/* middleware/index.js */

const validateSignup = require('./validateSignup')
const {
  makeToken,
  verifyToken
} = require('./jwToken')


module.exports = {
  validateSignup,
  makeToken,
  verifyToken
}