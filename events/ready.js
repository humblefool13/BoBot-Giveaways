const fs = require("fs");
const config_records = require("../models/configurations.js");
const wallets_records = require("../models/wallets.js");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Ended")
      .setEmoji("⚠️")
      .setCustomId("dead")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};
function findunique(entries) {
  let unique = [];
  entries.forEach((entry) => {
    if (unique.includes(entry)) return;
    unique.push(entry);
  });
  return unique.length;
};
function splitWinners(myArray, chunk_size) {
  var index = 0;
  var arrayLength = myArray.length;
  var tempArray = [];
  for (index = 0; index < arrayLength; index += chunk_size) {
    myChunk = myArray.slice(index, index + chunk_size);
    tempArray.push(myChunk);
  };
  return tempArray;
};
function messagesGenerator(arr) {
  let messages = [], count = 0;
  arr.forEach((messageWinners) => {
    let str = "";
    messageWinners.forEach((winnerID) => {
      str = str + `${++count}) <@${winnerID}>, `;
    });
    messages.push(str);
  });
  let lastOne = messages[messages.length - 1];
  lastOne = lastOne.slice(0, lastOne.length - 2) + "!";
  messages[messages.length - 1] = lastOne;
  return messages;
};

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`!!!!! ${client.user.tag} IS ON !!!!!`);

    //////////////////////// GIVEAWAYS ////////////////////////

    async function endGiveaways() {
      const giveawaysConfigsDir = fs.readdirSync("./giveaways/giveawayConfigs");
      giveawaysConfigsDir.forEach(async (file) => {
        if (file.includes("processing")) return;
        const fileData1 = fs.readFileSync(`./giveaways/giveawayConfigs/${file}`, { encoding: 'utf8', flag: 'r' });
        const fileData2 = fileData1.split("\n");
        const endTimestamp = Number(fileData2[2]);
        const winnerRole = fileData2[6];
        const msgUrl = fileData2[7];
        if (Date.now() < endTimestamp) return;
        fs.rename(`./giveaways/giveawayConfigs/${file}`, `./giveaways/giveawayConfigs/processing-${file}`, (e) => { if (e) console.log(e) });
        const entries1 = fs.readFileSync(`./giveaways/giveawayEntries/${file}`, { encoding: 'utf8', flag: 'r' });
        const entries2 = entries1.split("\n");
        const entries = shuffleArray(entries2);
        const unique = findunique(entries);
        let winners = [], number = Number(fileData2[1]), prizeName = fileData2[0];
        const locationString = file.slice(0, file.length - 4);
        const location = locationString.split("_");
        do {
          const index = Math.floor(Math.random() * entries.length);
          if (!winners.includes(entries[index]) && entries[index].length) {
            winners.push(entries[index]);
          };
        } while (winners.length !== number && winners.length !== unique);
        winners = shuffleArray(winners);
        const channel = await client.guilds.cache.get(location[0]).channels.fetch(location[1]).catch((e) => { });
        const message = await channel.messages.fetch(location[2]).catch((e) => { });
        if (!message || !channel) {
          fs.unlinkSync(`./giveaways/giveawayConfigs/processing-${file}`);
          fs.unlinkSync(`./giveaways/giveawayEntries/${file}`);
          return;
        };
        const description = message.embeds[0].description;
        await message.edit({
          components: [row],
          embeds: [new EmbedBuilder().setTitle("Giveaway Ended").setDescription(description).setColor("#FF0000").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
        });
        const splitted = splitWinners(winners, 70);
        const messages = messagesGenerator(splitted);
        const send = await message.channel.send("Just pinging to let them know ;)");
        messages.forEach(async (msg) => {
          await message.channel.send({
            content: msg,
          }).then((sent) => { sent.delete().catch((e) => { }) }).catch((e) => { });
        });
        await send.delete().catch((e) => { });
        await message.reply({
          embeds: [new EmbedBuilder().setDescription(`Congratulations to all the **${prizeName}** winners! :tada:\n◆ Unique Entries: ${unique}\n◆ Total Entries: ${entries.length}`).setColor("#8A45FF").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
        });
        messages.forEach(async (msg) => {
          await message.channel.send({
            embeds: [new EmbedBuilder().setDescription(msg).setColor("#8A45FF").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
          });
        });
        const members = await client.guilds.cache.get(location[0]).members.fetch();
        const wallets = await wallets_records.find({
          server_id: location[0],
        });
        let masterArray = [["User ID", "User Tag", "Submitted Wallet\n"].join(",")];
        winners.forEach((winner) => {
          const member = members.find((m) => m.id === winner) ? members.find((m) => m.id === winner) : { user: { tag: "Not Found" } };
          const userWallet = wallets.find((saved) => saved.discord_id === winner) ? wallets.find((saved) => saved.discord_id === winner) : { wallet: "Not Submitted" };
          masterArray.push([winner, member.user.tag, userWallet.wallet].join(","));
        });
        const guild = client.guilds.cache.get(location[0]);
        let exportString = `${guild.name} - ${prizeName} Winners\n\n` + masterArray.join("\n") + "\n\n© BoBotLabs Giveaway Bot.";
        fs.writeFileSync(`./export.txt`, exportString);
        const config = await config_records.findOne({
          server_id: location[0],
        });
        const channelID = config.submit_channel;
        const postChannel = await client.guilds.cache.get(location[0]).channels.fetch(channelID).catch((e) => { });
        if (!postChannel) {
          fs.unlinkSync(`./giveaways/giveawayConfigs/processing-${file}`);
          fs.unlinkSync(`./giveaways/giveawayEntries/${file}`);
          return;
        };
        const messageLinkRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel("Jump to Giveaway")
              .setStyle(ButtonStyle.Link)
              .setURL(msgUrl),
            new ButtonBuilder()
              .setLabel("Winners List")
              .setStyle(ButtonStyle.Link)
              .setURL(sent.url)
          );
        const postDescription = `Giveaway Ended\n:gift: Prize: **${prizeName}**\n:medal: Number of Winners: **${number}**\n:fox: Wallet Required: **${fileData2[8]}**`;
        postChannel.send({
          embeds: [new EmbedBuilder().setDescription(postDescription).setColor("#8A45FF").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
          files: [{
            attachment: './export.txt',
            name: `${guild.name.toLowerCase().replaceAll(" ", "")}_${prizeName.toLowerCase().replaceAll(" ", "")}.txt`,
            description: 'File with winners\' data.'
          }],
          components: [messageLinkRow],
        });
        if (winnerRole !== "NA") {
          let winnersDuplicate = winners;
          const interval = setInterval(doRoles, 500);
          async function giveRole(winnersDuplicate) {
            if (!winnersDuplicate.length) return;
            const member = members.find((m) => m.id === winnersDuplicate[winnersDuplicate.length - 1]);
            winnersDuplicate.pop();
            if (!member) return;
            member.roles.add(winnerRole).catch((e) => { });
          };
          async function doRoles() {
            if (winnersDuplicate.length) {
              await giveRole(winnersDuplicate);
            } else {
              clearInterval(interval);
            };
          };
        };
        fs.unlinkSync(`./giveaways/giveawayConfigs/processing-${file}`);
        fs.unlinkSync(`./giveaways/giveawayEntries/${file}`);
      });
    };
    endGiveaways();
    setInterval(endGiveaways, 60 * 1000);
  },
};