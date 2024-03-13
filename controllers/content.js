exports.public = (req, res) => {
  res.status(200).send("Public Content");
};

exports.user = (req, res) => {
  res.status(200).send("User Content");
};