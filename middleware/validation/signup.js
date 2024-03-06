const { User } = require('../../database')


const validateSignup = async (req, res, next) => {
  // These are the values that need to be checked
  const { username, email, password } = req.body

  // If status and message remain falsy, username, email and
  // roles are all valid; next() will be called. If not,
  // res.status(status).send({ message }) will be called.
  let status = 0
  let message = ""

  // Treating issues
  const treatDuplicateUsername = user => {
    if (user) {
      const username = user.username
      status = 400 // Bad Request
      message = `FAIL: username "${username}" is already taken`
    }
  }

  const treatInvalid = data => {
    const [ key, value ] = Object.entries(data)[0]
    status = 400 // Bad Request
    message = `FAIL: "${value}" is not a valid ${key}`
    proceed()
  }

  const treatDuplicateEmail = user => {
    if (user) {
      const email = user.email
      status = 400 // Bad Request
      message = `FAIL: email "${email}" is already taken`
    }
  }

  const treatDBError = error => {
    status = 500 // Internal Server Error
    message = error
  }

  // Start the chain of checks

  ;(function checkUsername(){
    if (!username) {
      treatInvalid({ username })

    } else {
      User
      .findOne({ username })
      .exec() // exec() makes the output of findOne() a Promise
      .then(treatDuplicateUsername)
      .catch(treatDBError)
      .finally(checkEmail)  
    }
  })()
  
  function checkEmail() {
    if (!status) { // There was no problem with username
      if (email.indexOf("@") < 0) {
        treatInvalid({ email })

      } else {
        User
        .findOne({ email })
        .exec() // makes the output of findOne() a Promise
        .then(treatDuplicateEmail)
        .catch(treatDBError)
        .finally(checkPassword)
      }
    } else {
      proceed()
    }
  }

  function checkPassword() {
    if (!status && !password || typeof password !== "string") {
      treatInvalid({ password })
    }
    
    proceed()
  }

  function proceed() {
    if (status) {
      // There was an error in the input values 
      res.status(status).send({ message })

    } else {
      // No error: time to create a new user
      next()
    }
  }
}


module.exports = validateSignup