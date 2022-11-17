const mongoose = require("mongoose");

const format = {
  server_id: String,
  defaults: [],
};

module.exports = mongoose.model('defaults', format);