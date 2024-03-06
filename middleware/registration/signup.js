const bcrypt = require('bcryptjs')
const { User } = require('../../database')


function signUp(req) {
  const { username, email, password } = req.body

  const hash = bcrypt.hashSync(password, 8)
  const options = { username, email, hash }


  const treatSuccess = (user) => {
    console.log("Document added to User collection", JSON.stringify(user, null, '  '));
    
  }


  const treatError = error => {
    console.log(`ERROR: ${name} role not saved
    ${error}`)
  }


  new User(options)
    .save()
    .then(treatSuccess)
    .catch(treatError)
}


module.exports = signUp