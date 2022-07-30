const mongoose = require("mongoose");

const format = {
  server_id: String,
  start_timestamp: Number,
  months: Number,
  end_timestamp: Number,
};

module.exports = mongoose.model('subscriptionRecords', format);