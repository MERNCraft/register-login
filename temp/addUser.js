const {
  validateSignup,
  signUp
} = require('../middleware')


const addUser = async () => {
  const req = {
    body: {
      username: "to_be_deleted",
      email: "delete@example.com",
      password: "p455w0rd"
    }
  }

  // Simulate the way that Express will call validation middleware
  // using validateSignup(req, res, next)

  const simulateValidation = ( resolve, reject ) => {
    const next = () => {
      console.log(`req.body details are valid:
${JSON.stringify(req, null, "  ")}`)
      resolve(req)
    }

    const res = {
      status: function() { return this },
      send: function(message) {
        reject(message)
      }
    }

    validateSignup(req, res, next)
  }

  new Promise(simulateValidation)
    .then(req => signUp(req))
    .catch(({ message }) => console.log(message))
}


module.exports = addUser