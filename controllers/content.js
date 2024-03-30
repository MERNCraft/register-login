/* controllers/content.js */

const public = (req, res) => {
  res.status(200).send("Public content")
};

const private = (req, res) => {
  res.status(200).send(`Private content for ${req.userId}`)
}

module.exports = {
  public,
  private
}