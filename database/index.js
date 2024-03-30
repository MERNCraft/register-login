/**
 * database/index.js
 *
 * Uses the mongoose module to connect to the MongoDB database
 * and imports all the models that mongoose will need.
 * 
 * Exports an object with entries for mongoose and all the models.
 */


const DB = process.env.DB

const mongoose = require('mongoose')
const User = require('./models/user')

mongoose
  .connect(DB)
  .then(() => {
    console.log(`Connected to ${DB}`)

    // // Temporary test to show that the database works
    // require('../test/addUser')()

  })
  .catch( error => {
    console.log("DB connection ERROR:\n", error);
    process.exit()
  })


const db = {
  mongoose,
  User
}


module.exports = db
