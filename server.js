/* server.js */

require('dotenv').config()
require('./database')
const PORT = process.env.PORT || 3000
const COOKIE_SECRET = process.env.COOKIE_SECRET || "string needed"

const express = require('express')
const cookieSession = require('cookie-session')

const cookieOptions = {
  name: "authorisation",
  keys: [ COOKIE_SECRET ],
  httpOnly: true,
  sameSite: true
}

const app = express()

app.use(express.json())
app.use(express.urlencoded())
app.use(cookieSession(cookieOptions))

app.use(express.static('public'))


require('./routes/authorization')(app)
require('./routes/content')(app)


app.get('/', (req, res) => {
  const protocol = req.protocol
  const host = req.headers.host // includes PORT number
  res.send(`<pre>Connected to ${protocol}://${host}
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