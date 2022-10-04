const mongoose = require("mongoose");

const format = {
  server_id: String,
};

module.exports = mongoose.model('defaults', format);