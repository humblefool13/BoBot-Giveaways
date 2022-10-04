const mongoose = require("mongoose");

const format = {
  discord_id: String,
  wallet_global: String,
  wallets: [[]],
  //[[GUILDID, WALLETADDRESS],[],[],[]]
};

module.exports = mongoose.model('wallets', format);