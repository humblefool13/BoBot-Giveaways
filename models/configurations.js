const mongoose = require("mongoose");

const format = {
  server_id: String,
  expired : Boolean,
  expired_timestamp: Number,
  role: String,
  submit_channel: String,
};

module.exports = mongoose.model('configs', format);