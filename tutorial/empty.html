require('dotenv').config()
require('./database')

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

app.use('/', express.static('public'))

app.get('/', (req, res) => {
  const { protocol, hostname } = req
  res.send(`<pre>Connected to ${protocol}://${hostname}:${PORT}
${Date()}</pre>`)
})


require('./routes/authorization')(app);
require('./routes/content')(app);


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
