const mongoose = require("mongoose");

const format = {
  discord_id: String,
  wallet: String,
  server_id: String,
};

module.exports = mongoose.model('wallets', format);