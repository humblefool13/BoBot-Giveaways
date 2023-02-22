const mongoose = require("mongoose");

const format = {
  discord_id: String,
  wallet_global_eth: String,
  wallet_global_sol: String,
  wallet_global_apt: String,
  wallet_global_mulx: String,
  wallets_eth: [[]],
  wallets_sol: [[]],
  wallets_apt: [[]],
  wallets_mulx: [[]],
};

module.exports = mongoose.model('wallets', format);