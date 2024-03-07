# Register + Log In #

## 1. Set up MongoDB
99. mongodb://localhost:27017/register

## 2. Bare-bones Express server
0. `npm install -g nodemon`
1. `npm init -y`
2. `npm i bcryptjs cookie-session cors dotenv express jsonwebtoken mongoose`
3. Create `server.js`:
```javascript
const PORT = process.env.PORT || 3000

const express = require('express')

const app = express()


app.get('/', (req, res) => {
  const { protocol, hostname } = req
  res.send(`<pre>Connected to ${protocol}://${hostname}:${PORT}
${Date()}</pre>`)
})


app.listen(PORT, logStuffToConsole)


function logStuffToConsole() {
  const nets = require("os").networkInterfaces()
  const ips = Object.values(nets)
  .flat()
  .filter(({ family }) => (
    family === "IPv4")
  )
  .map(({ address }) => address)
  ips.unshift("localhost")

  const hosts = ips.map( ip => (
    `http://${ip}:${PORT}`)
  ).join("\n  ")
  console.log(`Express server listening at:
  ${hosts}
  `);
}
```
4. Edit scripts in `package.json`:
```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "nodemon server.js"
  },
```
5. `npm start`
   
> \> register-login@1.0.0 start  
> \>nodemon server.js
>
>[nodemon] 3.0.2  
>[nodemon] to restart at any time, enter `rs`  
>[nodemon] watching path(s): *.*  
>[nodemon] watching extensions: js,mjs,cjs,json  
>[nodemon] starting `node server.js`  
>Express server listening at:  
>  http://localhost:3000  
>  http://127.0.0.1:3000  
>  http://192.168.0.10:3000

6. Ctrl-click or Cmd-click on one of the server URLs to open the link in your browser:

> Connected to http://localhost:3000
> Thu Mar 07 2024 21:03:21 GMT+0100 (Central European Time)


## 3. Connect to MongoDB through Mongoose
1. Create `.env`
```
PORT=5555
DB=mongodb://localhost:27017/register
```
2. Create `database/index.js`
```javascript
const DB = process.env.DB

const mongoose = require('mongoose')

const db = { mongoose }
module.exports = db


mongoose
  .connect(DB)
  .then(() => {
    console.log(`Connected to ${DB}`)
  })
  .catch( error => {
    console.log("DB connection ERROR:\n", error);
    process.exit()
  })
```
3. Edit `server.js`
```javascript
require('dotenv').config() // NEW LINE
require('./database')      // NEW LINE
const express = require('express')
const app = express()
```

> \> register-login@1.0.0 start  
> \> nodemon server.js  
> 
> [nodemon] 3.0.2  
> [nodemon] to restart at any time, enter `rs`  
> [nodemon] watching path(s): *.*  
> [nodemon] watching extensions: js,mjs,cjs,json  
> [nodemon] starting `node server.js`  
> Express server listening at:  
>   http://localhost:5555  
>   http://127.0.0.1:5555  
>   http://192.168.0.12:5555  
>   
> Connected to mongodb://localhost:27017/register

## 4. Create `User` model and test it
1. Create `database/models/user.js`
```javascript
const { Schema, model } = require('mongoose')

const schema = Schema({
  username: String,
  email: String,
  hash: String
})

const User = model("User", schema)

module.exports = User
```

2. Create `controllers/signup.js`
```javascript
const bcrypt = require('bcryptjs')
const { User } = require('../database')


function signUp(req) {
  const { username, email, password } = req.body

  const hash = bcrypt.hashSync(password, 8)
  const options = { username, email, hash }


  let message


  const treatSuccess = (user) => {
    message = `Document added to User collection
${JSON.stringify(user, null, '  ')}`
  }


  const treatError = error => {
    message = `ERROR: User for "${username}" not saved
${error}`
  }


  const proceed = () => {
    console.log(message )
  }


  new User(options)
    .save()
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)
}


module.exports = signUp
```

3. Create `controllers/index.js`:
```javascript
const signUp = require('./signup')

module.exports = {
  signUp
}
```

4. Create `temp/addUser.js`
```javascript
const {
  signUp
} = require('../controllers')


const addUser = async () => {
  const req = {
    body: {
      username: "to_be_deleted",
      email: "delete@example.com",
      password: "p455w0rd"
    }
  }

  signUp(req)
}


module.exports = addUser
```

5. Edit `database/index.js` to export `User` and call `addUser`:
```javascript
const DB = process.env.DB

const mongoose = require('mongoose')
const User = require('./models/user')                 // NEW LINE

mongoose
  .connect(DB)
  .then(() => {
    console.log(`Connected to ${DB}`)

    // Temporary test to show that the database works // NEW LINE
    require('../temp/addUser')()                      // NEW LINE

  })
  .catch( error => {
    console.log("DB connection ERROR:\n", error);
    process.exit()
  })


const db = {
  mongoose,
  User                                                 // NEW LINE
}


module.exports = db
```

> ```
> Connected to mongodb://localhost:27017/register  
> Document added to User collection {  
>   "username": "to_be_deleted",  
>   "email": "delete@example.com",  
>   "hash": "$2a$08$uXepGz.> RZ8qVg9JZqxBcZu5QEwqXFEwymd1otNPAp4GbRfGPvFNV6",  
>   "_id": "65e71c4ff17f18ac8e554336",  
>   "__v": 0  
> }
> ```
4. To view the newly created document(s), in new Terminal window run:
```
mongosh
use register
> switched to db register
db.users.find()
```
> Outputs many objects with a format like:
> ```
>{
>    _id: ObjectId('65ea03b4d229099a43b80419'),
>    username: 'to_be_deleted',
>    email: 'delete@example.com',
>    hash: '$2a$08$8tMlYhsOPSOjuaeEU1L2WupnvUUqxrc7jywNHUAR00aLHRI/TuZBC',
>    __v: 0
>  }
> ```

5. To delete these new documents, along with the whole `users` collection, run:
```
db.users.drop()
```
>```
>true
>```

## 5. Validate the data used to create a User document
1. Create `middleware/validation/signup.js` to check whether:
   * The given username is a non-empty string
   * The given username already exists
   * The given email is valid
   * The given email already exists
   * The password is a non-empty string
  
```javascript
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

    } else {
      proceed()
    }
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
```

2. Create `middleware/index.js`:
```javascript
const validateSignup = require('./validation/signup')

module.exports = {
  validateSignup
}
```

3. Edit `controllers/signup.js`
```javascript
const bcrypt = require('bcryptjs')
const { User } = require('../database')


function signUp(req, res) {
  const { username, email, password } = req.body

  const hash = bcrypt.hashSync(password, 8)
  const options = { username, email, hash }

  let status = 0
  let message


  const treatSuccess = (user) => {
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


  return new User(options)
    .save()
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)
}


module.exports = signUp
```
4. Edit `temp/addUser.js` to check whether the given data is valid. This script is complex, because it tests all the different validation errors that could occur.
```javascript
const { validateSignup } = require('../middleware')
const { signUp } = require('../controllers')


const addUser = async (req) => {
  const res = {
    status: function() { return this },
    send: ({ message }) => console.log(message)
  }


  const simulateValidation = ( resolve, reject ) => {
    const next = () => {
      resolve(req)
    }
    const send = function(message) {
      reject(message)
    }
    const sim_res = { ...res, send }

    validateSignup(req, sim_res, next)
  }


  const treatResolution = async (req) => {
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
  for (const req of requests) {
    await addUser(req)
  }
}



module.exports = addUsers
```

4. Delete any existting test User records (see Section 4, step 5)
5. Stop the server: activate the Terminal window where the server is running and press Ctrl-C.
6. Restart the server: `npm start`.

> Express server listening at:  
>   http://localhost:5555  
>   http://127.0.0.1:5555  
>   http://192.168.0.10:5555  
>
> Connected to mongodb://localhost:27017/register  
> SUCCESS: create user 'to_be_deleted'  
> SUCCESS: no username (should fail)  
> Document added to User collection  
> {  
>   "username": "to_be_deleted",  
>   "email": "delete@example.com",  
>   "hash": "$2a$08$LWzMxA.WWK6Oj9qzxxCAJ.U8.PechSjDq8gmjD9XFSYkebNT1v.Su",  
>   "_id": "65ea0689afee055eb6772960",  
>   "__v": 0  
> }  
> SUCCESS: no email (should fail)  
> SUCCESS: invalid email (should fail)  
> SUCCESS: no password (should fail)  
> SUCCESS: duplicate username (should fail)  
> SUCCESS: duplicate email (should fail)

## 6. Add a route for the signup process
1. In `database/index.js`, comment out the temporary test command:
```javascript
    // require('../temp/addUser')()

```
2. Create `routes/authorization.js`
```javascript
const { validateSignup } = require('../middleware')
const { signUp } = require('../controllers')


const routes = app => {
  app.post('/signup', [ validateSignup, signUp ])
}


module.exports = routes
```

2. Edit these lines near the beginning of `server.js`
```javascript
const express = require('express')
const { json, urlencoded } = express    // NEW LINE
const app = express()

app.use(json())                         // NEW LINE
app.use(urlencoded({ extended: true })) // NEW LINE
```

3. Add this line to `server.js`
```javascript
require('./routes/authorization')(app)  // NEW LINE

app.listen(PORT, logStuffToConsole)
```
