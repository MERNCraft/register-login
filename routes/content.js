/* routes/content.js */

const { verifyToken } = require("../middleware")
const { public, private } = require("../controllers")

module.exports = function(app) {
  app.get("/public", public)
  app.get("/private", verifyToken, private)
}