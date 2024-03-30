/**
* test/addUser.js
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
 // Return a promise so that the calling function addUsers()
 // can `await` its fulfilment
 return new Promise(simulateValidation)
   .then(treatResolution)
   .catch(({ message }) => treatRejection(req, message))

 function simulateValidation ( resolve, reject ) {
   // Create a mock res function which will call `resolve` if
   // `send` is called with a message that looks like...
   //    {
   //      "message": "User record created",
   //      "user": {
   //        "username": "user_523128",
   //        "email": "user_523128@example.com"
   //      }
   //    }

   const res = {
     // status simply allows chaining of res.status().send()
     status: function() { return this },
     // send calls reject for any message which does not include
     // "User record created". Such messages are only created
     // by a successful call to new User() in signUp()
     send: (message) => {
       if ( /"User record created"/.test(message) ) {
         console.log("result from signUp:", message);
         resolve(req)

       } else {
         reject(message)
       }
     }
   }

   // Provide a next() function which will only be called if
   // validation succeeds, so signUp() will not be called if
   // validation fails.

   const next = () => {
     console.log(`
req.body validated:
${JSON.stringify(req.body, null, '  ')}
signUp() will be now called to create a User document`);
     // If the argument for res.send() contains the string
     // "User record created", this Promise will resolve. If
     // signUp() fails, this Promise will be rejected.
     signUp(req, res)
   }

   validateSignup(req, res, next)
 }

 // Instead of sending a response to a (non-existent) client,
 // simply trigger a function to log the message that would
 // be sent.

 async function treatResolution(req) {
   // Ensure that signUp is complete before testing the next req
   logResult(req.expected === true)
 }

 async function treatRejection(req, message ) {
   logResult(req.expected === false, message)
 }

 function logResult(success, message) {
   message = (success)
     ? `✅︎ ${req.name}` // success should always be true
     : `❌ ${message}
req: ${JSON.stringify(req, null, "  ")}` // should never happen
   console.log(message)
 }
}



// Create a username and password which is unlikely to exist in
// the User collection
const randomName = "user_" +
 "random".replace(/./g, c => Math.floor(Math.random() * 10))
const randomEmail = randomName + "@example.com"



// Create one request that should succeed, and a series of
// requests that should all fail for different reasons.
// Note that `name` and `expected` are not standard fields
// in a req object.
const requests = [
 {
   body: {
     username: randomName,
     email: randomEmail,
     password: "p455w0rd"
   },
   name: `create user '${randomName}' (should pass)`,
   expected: true
 },
 { name: "no body (should fail)",
   expected: false
 },
 {
   body: {
     username: randomName,
     email: "unique@example.com",
     password: "duplicate_username"
   },
   name: `duplicate username ${randomName} (should fail)`,
   expected: false
 },
 { body: {},
   name: "empty body (should fail)",
   expected: false
 },
 {
   body: {
     email: "delete@example.com",
     password: "p455w0rd"
   },
   name: "no username (should fail)",
   expected: false
 },
 {
   body: {
     username: "duplicate_email",
     email: randomEmail,
     password: "p455w0rd"
   },
   name: `duplicate email ${randomEmail} (should fail)`,
   expected: false
 },
 {
   body: {
     username: "",
     email: "delete@example.com",
     password: "p455w0rd"
   },
   name: "empty username (should fail)",
   expected: false
 },
 {
   body: {
     username: "no_email",
     password: "p455w0rd"
   },
   name: "no email (should fail)",
   expected: false
 },
 {
   body: {
     username: "no_email",
     email: "",
     password: "p455w0rd"
   },
   name: "empty email (should fail)",
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
   },
   name: "no password (should fail)",
   expected: false
 },
 {
   body: {
     username: "empty_password",
     email: "delete@example.com",
     password: ""
   },
   name: "empty password (should fail)",
   expected: false
 }
]



// Iterate through the requests, waiting for each one to complete
// before starting the next, so that the first (successful)
// request will complete before the final requests with duplicate
// data are made.
async function addUsers(){
 // Use `for` not `forEach` because `forEach` cannot `await`
 for (const req of requests) {
   await addUser(req)
 }
}



module.exports = addUsers