/**
 * temp/addUser.js
 *
 * Called by database/index.js during development, to ensure that
 * the validation and creation of new User documents is working as
 * expected.
 *
 * Simulate the way that Express will call validation middleware
 * using validateSignup(req, res, next)
 */


const { validateSignup } = require('../middleware')
const { signUp } = require('../controllers')


const addUser = async (req) => {
  // Create a res function to call if validation is successful
  const res = {
    status: function() { return this },
    // Instead of sending a response to a (non-existent) client,
    // simply log the message that would be sent.
    send: (message) => console.log(message)
  }


  const simulateValidation = ( resolve, reject ) => {
    // The next function will be called if validation succeeds
    const next = () => {
      resolve(req)
    }

    // Use a modified res function to trigger rejection during
    // the simulation if a response is "sent" to indicate that
    // the validation has failed
    const send = function(message) {
      reject(message)
    }
    const sim_res = { ...res, send }

    // Call validateSignup with the faked res and next functions
    // next() will only be called if validation succeeds.
    validateSignup(req, sim_res, next)
  }


  const treatResolution = async (req) => {
    // Ensure that signUp is complete before testing the next req
    await signUp(req, res)
    logResult(req.expected === true)
  }


  const treatRejection = (req, message ) => {
    logResult(req.expected === false, message)
  }


  const logResult = (success, message) => {
    message = (success)
      ? `SUCCESS: ${req.name}`
      : `ERROR: ${message}
req.body: ${JSON.stringify(req, null, "  ")}`
    console.log(message)
  }


  // Return a promise so that the calling function can `await`
  // its fulfilment
  return new Promise(simulateValidation)
    .then(treatResolution)
    .catch(({ message }) => treatRejection(req, message))
}



const requests = [
  {
    body: {
      username: "to_be_deleted",
      email: "delete@example.com",
      password: "p455w0rd"
    },
    name: "create user 'to_be_deleted'",
    expected: true
  },
  {
    body: {
      username: "",
      email: "delete@example.com",
      password: "p455w0rd"
    },
    name: "no username (should fail)",
    expected: false
  },
  {
    body: {
      username: "no_email",
      email: "",
      password: "p455w0rd"
    },
    name: "no email (should fail)",
    expected: false
  },
  {
    body: {
      username: "invalid_email",
      email: "delete_at_example.com",
      password: "p455w0rd"
    },
    name: "invalid email (should fail)",
    expected: false
  },
  {
    body: {
      username: "no_password",
      email: "delete@example.com",
      password: ""
    },
    name: "no password (should fail)",
    expected: false
  },
  {
    body: {
      username: "to_be_deleted",
      email: "unique@example.com",
      password: "duplicate_username"
    },
    name: "duplicate username (should fail)",
    expected: false
  },
  {
    body: {
      username: "duplicate_email",
      email: "delete@example.com",
      password: "p455w0rd"
    },
    name: "duplicate email (should fail)",
    expected: false
  }
]



async function addUsers(){
  // Use `for` not `forEach` because `forEach` does not `await`
  for (const req of requests) {
    await addUser(req)
  }
}



module.exports = addUsers