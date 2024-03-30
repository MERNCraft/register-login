/* database/models/user.js */

const { Schema, model } = require('mongoose')

const schema = Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  hash: { type: String, required: true }
})

const User = model("User", schema)

module.exports = User