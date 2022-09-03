const mongoose = require("mongoose");

const format = {
  discord_id: String,
  twitter_id: String,
  t_username: String,
};

module.exports = mongoose.model('twitter', format);