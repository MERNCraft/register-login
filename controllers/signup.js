const bcrypt = require('bcryptjs')
const { User } = require('../database')


function signUp(req, res) {
  const { username, email, password } = req.body

  const hash = bcrypt.hashSync(password, 8)
  const options = { username, email, hash }

  let status = 0
  let message = ""


  const treatSuccess = async (user) => {
    message = `Document added to User collection
${JSON.stringify(user, null, '  ')}`
  }


  const treatError = error => {
    status = 500 // Server Error
    message = error
  }


  const proceed = () => {
    if (status) {
      res.status(status)
    } // else status will be set to 200 by default

    res.send({ message })
  }


  // Return a promise, so that the calling function can use
  // .then() and .catch() to know if it was successful.
  return new User(options)
    .save()
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)
}


module.exports = signUp