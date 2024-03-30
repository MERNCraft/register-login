/* controllers/signup.js */

const bcrypt = require('bcryptjs')
const { User } = require('../database')


function signUp(req, res) {
  const { username, email, password } = req.body

  const hash = bcrypt.hashSync(password, 8)
  const userData = { username, email, hash }

  let message

  new User(userData)
    .save()
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)

  function treatSuccess(user) {
    const { username, email } = user
    message = {
      message: "User record created",
      user: {
        username,
        email
      }
    }
    message = JSON.stringify(message, null, "  ")
  }

  function treatError(error) {
    message = `ERROR: User for "${username}" not saved
${error}`
  }

  function proceed () {
    res.send(message )
  }
}


module.exports = signUp
