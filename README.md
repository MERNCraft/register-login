# Register + Log In #

## 1. Set up MongoDB
99. mongodb://localhost:27017/register

## 2. Bare-bones Express server
0. `npm install -g nodemon`
1. `npm init -y`
2. `npm i bcryptjs cookie-session cors dotenv express jsonwebtoken mongoose`
3. Create `server.js`:
```javascript
const PORT = 3000

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

const db = {}
module.exports = db

db.mongoose = mongoose

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
const express = require('express')
const db = require('./database') // NEW LINE
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
>   http://localhost:5555  
>   http://127.0.0.1:5555  
>   http://192.168.0.12:5555  
>   http://192.168.0.10:5555  
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

2. Create `middleware/registration/signup.js`
```javascript
const bcrypt = require('bcryptjs')


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
```

3. Create `middleware/index.js`:
```javascript
const signUp = require('./registration/signup')

module.exports = {
  signUp
}
```

4. Create `temp/addUser.js`
```javascript
const {
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

  signUp(req)
}


module.exports = addUser
```

5. Edit `database/index.js` to export `User` and call `addUser`:
```javascript
const DB = process.env.DB

const mongoose = require('mongoose')
const User = require('./models/user')                  // NEW LINE

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

> Connected to mongodb://localhost:27017/register
> Document added to User collection {
>   "username": "to_be_deleted",
>   "email": "delete@example.com",
>   "hash": "$2a$08$uXepGz.> RZ8qVg9JZqxBcZu5QEwqXFEwymd1otNPAp4GbRfGPvFNV6",
>   "_id": "65e71c4ff17f18ac8e554336",
>   "__v": 0
> }
4. To delete any newly created document(s), in the Terminal run:
```
mongosh
use register
> switched to db register
db.users.estimatedDocumentCount()
> 1
db.users.deleteMany({ username: "to_be_deleted" })
> { acknowledged: true, deletedCount: 1 }
```

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
```

2. Edit `middleware/index.js` to include the new middleware function:
```javascript
const validateSignup = require('./validation/signup')
const signUp = require('./registration/signup')

module.exports = {
  validateSignup,
  signUp
}
```

3. Edit `temp/addUser.js` to check whether the given data is valid:
```javascript
const {
  validateSignup,
  signUp
} = require('../middleware')


const addDummyRecord = async () => {
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


module.exports = addDummyRecord
```
> FAIL: username "to_be_deleted" is already taken





6. Delete the test User record (see Section 4, step 4)
7. Edit the values in...
```javascript
    {
      username: "to_be_deleted",
      email: "delete@example.com",
      password: "p455w0rd"
    }
```
... to make them invalid, and check what is logged in the Terminal window when the script is restarted.