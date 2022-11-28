const mongoose = require("mongoose");

const format = {
  discord_id: String,
  access_token: String,
  refresh_token: String,
};

module.exports = mongoose.model('twitter', format);