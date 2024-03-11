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
    const { username, email } = user
    message = {
      message: "User record created",
      user: {
        username,
        email
      }
    }
    message = JSON.stringify(message, null, "  ")
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
> {
>    message: 'User record created',
>    user: {
>      username: 'to_be_deleted',
>      email: 'delete@example.com'
>    }
>  }
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
1. Create `middleware/validationSignup.js` to check whether:
   * The given username is a non-empty string
   * The given username already exists
   * The given email is valid
   * The given email already exists
   * The password is a non-empty string
  
```javascript
const { User } = require('../database')


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
    message = { error: error.message }
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
    if (!status && !password ) {
      treatInvalid({ password })

    } else {
      proceed()
    }
  }

  function proceed() {
    if (status) {
      // There was an error in the input values 
      res.status(status).send(message)

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
const validateSignup = require('./validationSignup')

module.exports = {
  validateSignup
}
```

3. Edit `temp/addUser.js`
```javascript
const { validateSignup } = require('../middleware')
const { signUp } = require('../controllers')


const addUser = async (req) => {
  const res = {
    status: function() { return this },
    send: (message) => console.log(message)
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

> ```
> Express server listening at:  
>   http://localhost:5555  
>   http://127.0.0.1:5555  
>   http://192.168.0.10:5555  
>
> Connected to mongodb://localhost:27017/register  
> SUCCESS: create user 'to_be_deleted'
> SUCCESS: no username (should fail)
> {
>   message: 'User record created',
>   user: {
>     username: 'to_be_deleted',
>     email: 'delete@example.com'
>   }
> } 
> SUCCESS: no email (should fail)
> SUCCESS: invalid email (should fail)
> SUCCESS: no password (should fail)
> SUCCESS: duplicate username (should fail)
> SUCCESS: duplicate email (should fail)
> ```

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

3. Edit these lines near the beginning of `server.js`
```javascript
const express = require('express')
const { json, urlencoded } = express    // NEW LINE
const app = express()

app.use(json())                         // NEW LINE
app.use(urlencoded({ extended: true })) // NEW LINE
```

4. Add this line to `server.js`
```javascript
require('./routes/authorization')(app)  // NEW LINE

app.listen(PORT, logStuffToConsole)
```

> If you use an API Tester (Postman, Insomnia, Thunder > Client, ...), you can already check if your `signup` route is workning. Make a POST request to http://> localhost:5555/signup with the JSON payload `{ "username": "me", > "email": "me@example.com", "password": "my_password" }`
>    
> The response should be something like:
> > Status: 200 OK
> > ```
> > {
>     "message": "User record created",
>     "user": {
>       "username": "me",
>       "email": "me@example.com"
>     }
>   }
> > ```
> 
> Send the request again:
> > Status: 400
> > ```
> > {
> >   "message": "FAIL: username \"me\" is already taken"
> > }
> > ```

## 7. Add a signup page 
1. Create a new file at `public/site/signup/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Up</title>
  <style>
    body { 
      min-height: 100vh;
      background-color: #000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    form {
      width: 12em;
      background-color: #222;
      color: #ddd;
      padding: 1em;
      border-radius: 1em;
    }
    label {
      display: block;
      margin-bottom: 1em;
    }
    span {
      display: block;
      width: 5em;
    }
    input:invalid {
      border: 1px solid #f00;
    }
    form:invalid button {
      pointer-events: none;
      opacity: 0.25;
    }
  </style> 
</head>

<body>
  <form
    id="register"
  >
    <label for="username">
      <span>Username:</span>
      <input
        type="text"
        id="username"
        name="username"
        value=""
        required
      />
    </label>
    <label for="email">
      <span>Email:</span>
      <input
        type="email"
        id="email"
        name="email"
        value=""
        required
      />
    </label>
    <label for="password">
      <span>Password:</span>
      <input
        type="password"
        id="password"
        name="password"
        value=""
        required
      />
    </label>
    <button
      type="submit"
    >
      Register
    </button>
  </form>

  <script>
  ;(function () {
    "use strict"
    const url = "http://localhost:5555/signup"
    const form = document.getElementById("register")

    form.onsubmit = event => {
      event.preventDefault()
      const formData = new FormData(form)
      const body = JSON.stringify(
        Object.fromEntries(formData)
      )    
      
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body,
      }

      fetch(url, options)
        .then(response => response.json())
        .then(json => console.log("fetch response:", json))
        .catch(error => console.log("error:", error))
    }
  })()
  </script> 
</body>
</html>
```

2. Add a line to `server.js`
```javascript
app.use(json())
app.use(urlencoded({ extended: true }))
app.use('/site', express.static('public')) // NEW LINE
```
3. Visit [http://localhost:5555/site/signup/](http://localhost:5555/site/signup/) in your browser
4. Open the Console tab in the Developer Tools
5. Use the form to send a POST request to [http://localhost:5555/signup](http://localhost:5555/signup)
6. Check the result in the browser Console
```
fetch response: 
{ message: "User record created",
  user: { username: "me", email: "me@example.com" }}
```
7. Submit the form again:
```
POST http://localhost:5555/signup [HTTP/1.1 400 Bad Request]
fetch response: 
{ message: 'FAIL: username "me" is already taken' }
```

## 8. Add a route and a form for logging in
1. Add two lines to `.env`
```
JWT_SECRET="go hang a salami"
COOKIE_SECRET="cannot be undefined"
```
You should use your own strings and keep them secret. These secrets are used to encrypt JSON Web Tokens (JWT or "joot" tokens") that will be sent to your client as a cookie.

2. Create `controllers/signin.js`
3. Edit `controllers/index.js` to look like this:
```javascript
const signUp = require('./signup')
const signIn = require('./signin') // NEW LINE

module.exports = {
  signUp,
  signIn                           // NEW LINE
}
```
4. Add `controllers/signin.js`:
```javascript
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
```
5. Add `middleware/jwToken.js`:
```javascript
const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET

const DEFAULTS = {
  algorithm: 'HS256',
  allowInsecureKeySizes: true,
  expiresIn: 86400, // 24 hours
}


const makeToken = ( payload, options = {} ) => {
  if (typeof options !== "object") {
    // Ignore not-object options
    options = {}
  }

  options = { ...DEFAULTS, ...options }

  // <<< Remove entries that can be in payload OR in options,
  // but not in both places. If this is not done, jwt.sign()
  // will throw an error.
  const onlyOne = {
    exp: "expiresIn",
    nbf: "notBefore",
    aud: "audience",
    sub: "subject",
    iss: "issuer"
  }

  Object.entries(onlyOne).forEach(( [ pay, opt ]) => {
    if (pay in payload) {
      delete options[opt]
    }
  })
  // Remove >>>

  const token = jwt.sign(
    payload,
    JWT_SECRET,
    options
  )
  
  return token
}


const verifyToken = (req, res, next) => {
  const token = req.session.token

  // If status and message remain falsy, username, email and
  // roles are all valid; proceed() will call next(). If not,
  // proceed() will call res.status(status).send({ message }).
  let status = 0
  let message = ""

  if (!token) {
    status = 403 // Forbidden
    message = "No token provided"
    proceed()

  } else {
    jwt.verify(token, JWT_SECRET, treatVerification)
  }

  function treatVerification(error, { id }) {
    if (error) {
      status = 401 // Unauthorized
      message = "Unauthorized"

    } else {
      req.userId = id
      proceed()
    }
  }

  function proceed() {
    if (status) {
      return res.status(status).send({ message })
    }

    next()
  }
}


module.exports = {
  makeToken,
  verifyToken
}
```

6. Edit `middleware/index.js` so that it looks like this:
```javascript
const validateSignup = require('./validateSignup')
const { makeToken } = require('./jwToken') // NEW LINE

module.exports = {
  validateSignup,
  makeToken                                // NEW LINE
}
```

6. Edit `routes/authorization.js`, so that it looks like this:
```javascript
const {
  validateSignup
} = require('../middleware')
const {
  signUp,
  signIn                        // NEW LINE
} = require('../controllers')


const routes = app => {
  app.post('/signup', [ validateSignup, signUp ])

  app.post('/signin', signIn )  // NEW LINE
}


module.exports = routes
```

7. Edit `server.js`, with these lines, to activate cookies:
```
const PORT = process.env.PORT || 3000
const COOKIE_SECRET = process.env.COOKIE_SECRET || ""

const express = require('express')
const { json, urlencoded } = express
const cookieSession = require('cookie-session')

const app = express()

const cookieOptions = {
  name: "cookie-session",
  keys: [ COOKIE_SECRET ],
  httpOnly: true,
  sameSite: true
}

app.use(json())
app.use(urlencoded({ extended: true }))
app.use(cookieSession(cookieOptions))

app.use('/site', express.static('public'))
```
8. Create a new file at `public/signin/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In</title>
  <style>
    body {
      min-height: 100vh;
      background-color: #000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    form {
      width: 12em;
      background-color: #222;
      color: #ddd;
      padding: 1em;
      border-radius: 1em;
    }
    label {
      display: block;
      margin-bottom: 1em;
    }
    span {
      display: block;
      /* width: 5em; */
    }
    input:invalid {
      border: 1px solid #f00;
    }
    form:invalid button {
      pointer-events: none;
      opacity: 0.25;
    }
  </style>
</head>

<body>
  <form
    id="sign-in"
  >
  <label for="username">
    <span>Username:</span>
    <input
      type="text"
      id="username"
      name="username"
      value=""
    />
  </label>
  <label for="email">
    <span>Email:</span>
    <input
      type="email"
      id="email"
      name="email"
      value=""
    />
  </label>
  <label for="id">
    <span>Username OR Email:</span>
    <input
      type="text"
      id="id"
      name="id"
      value=""
    />
  </label>
    <label for="password">
      <span>Password:</span>
      <input
        type="password"
        id="password"
        name="password"
        value=""
        required
      />
    </label>
    <button
      type="submit"
    >
      Sign In
    </button>
  </form>

  <script>
  ;(function () {
    "use strict"
    const url = "http://localhost:5555/signin"
    const form = document.getElementById("sign-in")

    form.onsubmit = event => {
      event.preventDefault()
      const formData = new FormData(form)

      const replacer = (key, value) => {
        return !!value ? value : undefined
      }

      const body = JSON.stringify(
        Object.fromEntries(formData), replacer, ""
      )
      console.log("body:", body);

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body,
      }

      fetch(url, options)
        .then(response => response.json())
        .then(json => console.log("signin response:", json))
        .catch(error => console.log("error:", error))
    }
  })()
  </script>
</body>
</html>
```

9. Visit the page at [http://localhost:5555/site/signin](http://localhost:5555/site/signin)
10. Fill in any _one_ of the fields `Username`, `Email`, `Username OR Email` with the contact details of a User that you created earlier.
11. Enter the correct password for this User, and press Sign In
12. Look in the Developer Console. You should see something like:
```
body: {"id":"me","password":"pass"}
signin response: Object { success: "Logged in!" }
```