const bcrypt = require('bcryptjs')
const { User } = require('../database')
const { makeToken } = require('../middleware')


function signIn(req, res) {
  const { username, email, id, password } = req.body
  // id, here, is either username or password

  let status = 0
  let message = ""


  // Allow user to log in with either username or email
  const promises = [
    findUser({ email }),
    findUser({ username }),
    findUser({ email: id }),
    findUser({ username: id })
  ]


  function findUser(query) {
    return new Promise((resolve, reject ) => {
      User.findOne(query).exec()
      .then(checkPassword)
      .catch(reject)
      
      function checkPassword(user) {
        if (user) {
          const pass = bcrypt.compareSync(password, user.hash)
          if (pass) {
            return resolve(user)
          }
        }

        reject()
      }
    })
  }


  const treatSuccess = user => {
    const { id } = user
    // id, here, is the unique value stored in MongoDB
    const token = makeToken({ id })
    req.session.token = token
    message = { success: "Logged in!" }
  }


  const treatError = error => {
    // TODO: log error
    status = 401 // Unauthorized
    message = { fail: "Invalid login credentials" }
  }


  const proceed = () => {
    if (status) {
      res.status(status)
    }

    res.send(message)
  }


  const fullfilled = Promise.any(promises)
  fullfilled
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)
}


module.exports = signIn