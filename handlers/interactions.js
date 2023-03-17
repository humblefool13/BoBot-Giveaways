const Discord = require('discord.js');
const fs = require('fs');
const ascii = require('ascii-table');
let table = new ascii('Interactions');
table.setHeading('Interaction', 'Load status');
console.log('Loading Interactions!');
module.exports = (client) => {
  let interactions = fs
    .readdirSync('./interactions/')
    .filter((file) => file.endsWith('.js'));
  for (let interaction of interactions) {
    let pull = require(`../interactions/${interaction}`);
    if (pull.name) {
      client.interactions.set(pull.name, pull);
      table.addRow(interaction, '✅');
    } else {
      table.addRow(
        interaction,
        `❗ error -> missing a help.name, or help.name is not a string.`
      );
    }
  }
  console.log(table.toString());
};
