const mongoose = require("mongoose");

const format = {
  discord_id: String,
  outh_token: String,
  outh_token_secret: String,
  screen_name: String,
  twitter_id: String,
};

module.exports = mongoose.model('twitter', format);