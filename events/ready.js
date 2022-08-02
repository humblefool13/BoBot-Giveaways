const fs = require("fs");
const config_records = require("../models/configurations.js");
const XLSX = require("xlsx");
const wallets_records = require("../models/wallets.js");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

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
const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Ended")
      .setEmoji("⚠️")
      .setCustomId("dead")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );
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
  lastOne = lastOne.slice(0, lastOne.length - 2) + ".";
  messages[messages.length - 1] = lastOne;
  return messages;
};


module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log("!!!!! BOBOT RAFFLES IS ON !!!!!");

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
        const channel = await client.guilds.cache.get(location[0]).channels.fetch(location[1]);
        const message = await channel.messages.fetch(location[2]);
        const description = message.embeds[0].description;
        await message.edit({
          components: [row],
          embeds: [new EmbedBuilder().setTitle("Giveaway Ended").setDescription(description).setColor("#FF0000").setFooter({ text: "Powered by BoBot Labs" })],
        });
        const splitted = splitWinners(winners, 75);
        const messages = messagesGenerator(splitted);
        await message.reply(`:tada: Congratulations to all **${prizeName}** winners!\n:small_blue_diamond: Unique Entries: ${unique}\n:small_blue_diamond: Total Entries: ${entries.length}`);
        messages.forEach(async (msg) => {
          await message.reply({
            content: msg,
          });
        });
        const members = await client.guilds.cache.get(location[0]).members.fetch();
        const wallets = await wallets_records.find({
          server_id: location[0],
        });
        let masterArray = [["Discord ID", "Discord Tag", "Submitted Wallet"]];
        winners.forEach((winner) => {
          const member = members.find((m) => m.id === winner) ? members.find((m) => m.id === winner) : { user: { tag: "Not Found" } };
          const userWallet = wallets.find((saved) => saved.discord_id === winner) ? wallets.find((saved) => saved.discord_id === winner) : { wallet: "Not Submitted" };
          masterArray.push([winner, member.user.tag, userWallet.wallet]);
        });
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(masterArray);
        XLSX.utils.book_append_sheet(workbook, worksheet, `${prizeName.toLowerCase()}_winners`);
        XLSX.writeFileXLSX(workbook, "./export.xlsx");
        const config = await config_records.findOne({
          server_id: location[0],
        });
        const channelID = config.submit_channel;
        const postChannel = await client.guilds.cache.get(location[0]).channels.fetch(channelID);
        const guild = client.guilds.cache.get(location[0]);
        postChannel.send({
          content: `:alarm_clock: **${prizeName}** Giveaway Ended - ${msgUrl}\nThe file with winner data is attached below.`,
          files: [{
            attachment: './export.xlsx',
            name: `${prizeName}_${guild.name}.xlsx`,
            description: "The file containing winners and their saved wallets."
          }],
        });
        if (winnerRole !== "NA") {
          winners.forEach((winner) => {
            const member = members.find((m) => m.id === winner);
            if (!member) return;
            member.roles.add(winnerRole).catch((e) => { });
          });
        };
        fs.unlinkSync(`./giveaways/giveawayConfigs/processing-${file}`);
        fs.unlinkSync(`./giveaways/giveawayEntries/${file}`);
        fs.unlinkSync("./export.xlsx");
        fs.open("./export.xlsx", "w", (e,f) => { });
      });
    };
    endGiveaways();
    setInterval(endGiveaways, 60 * 1000);
  },
};