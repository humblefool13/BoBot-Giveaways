const mongoose = require("mongoose");

const format = {
  server_id: String,
  expired: Boolean,
  expired_timestamp: Number,
  role: String,
  submit_channel: String,
  winners_channel: String,
  server_timezone: String,
};

module.exports = mongoose.model('configs', format);