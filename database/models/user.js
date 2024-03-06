const { Schema, model } = require('mongoose')

const schema = Schema({
  username: String,
  email: String,
  hash: String
})

const User = model("User", schema)

module.exports = User