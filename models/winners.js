const mongoose = require('mongoose');

const format = {
  guild_id: String,
  prize_name: String,
  entries: String,
  deleteTimestamp: String,
  reminderTimestamp: String,
  exportID: String,
  messageLink: String,
  winnersData: [[]],
};

module.exports = mongoose.model('winners', format);
