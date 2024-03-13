const { verifyToken } = require("../middleware");
const { public, user } = require("../controllers");

module.exports = function(app) {
  app.get("/public", public);

  app.get("/user", [verifyToken], user);
}