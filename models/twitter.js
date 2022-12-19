const mongoose = require("mongoose");

const format = {
  discord_id: String,
  twitter_id: String,
  access_token_twitter: String,
  access_token_discord: String,
  refresh_token_twitter: String,
  refresh_token_discord: String,
};

module.exports = mongoose.model('twitter', format);