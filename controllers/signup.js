const bcrypt = require('bcryptjs')
const { User } = require('../database')


function signUp(req, res) {
  const { username, email, password } = req.body

  const hash = bcrypt.hashSync(password, 8)
  const options = { username, email, hash }

  let status = 0
  let message = ""


  const treatSuccess = user => {
    const { username, email } = user
    message = {
      message: "User record created",
      user: {
        username,
        email
      }
    }
  }


  const treatError = error => {
    // Validation failed when creating the document

    // console.log("error:", JSON.stringify(error, null, "  "))
    // { "errors": {
    //     "email": {
    //       "stringValue": "\"[]\"",
    //       "valueType": "Array",
    //       "kind": "string",
    //       "value": [],
    //       "path": "email",
    //       "reason": null,
    //       "name": "CastError",
    //       "message": "Cast to string failed for value \"[]\" (type Array) at path \"email\""
    //     }
    //   },
    //   "_message": "User validation failed",
    //   "name": "ValidationError",
    //   "message": "User validation failed: email: Cast to string failed for value \"[]\" (type Array) at path \"email\""
    // }
    
    status = 500 // Server Error
    message = { error: error.message }
  }


  const proceed = () => {
    if (status) {
      res.status(status)
    } // else status will be set to 200 by default

    res.send(message)
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