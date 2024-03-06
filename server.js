require('dotenv').config()
const PORT = process.env.PORT

const express = require('express')
const db = require('./database')
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
