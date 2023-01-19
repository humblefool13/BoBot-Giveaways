const fs = require("fs");
const config_records = require("../models/configurations.js");
const wallets_records = require("../models/wallets.js");
const sub_records = require("../models/subscriptions.js");
const excel = require('exceljs');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ActivityType } = require("discord.js");
async function pastecord(text) {
  let data = await pasteClient.publish(text).catch();
  if (!data) data = {
    url: false
  };
  return data.url;
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
function findWallet(walletData, userId, guildId) {
  for (let i in walletData) {
    const userAccount = walletData[i];
    if (userAccount.discord_id === userId) {
      const guildWallets = userAccount.wallets;
      const find = guildWallets.find((el => el[0] === guildId));
      if (find) {
        return find[1];
      } else {
        return userAccount.wallet_global;
      };
    };
  };
  return 'Not Found.';
};


module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`!!!!! ${client.user.tag} IS ON !!!!!`);
    client.user.setActivity('Your Giveaways!', { type: ActivityType.Watching });

    //////////////////////// GIVEAWAYS ////////////////////////

    async function endGiveaways() {
      const giveawaysConfigsDir = fs.readdirSync("./giveaways/giveawayConfigs");
      for (const file of giveawaysConfigsDir) {
        if (!file.includes("processing")) {
          const fileData1 = fs.readFileSync(`./giveaways/giveawayConfigs/${file}`, { encoding: 'utf8', flag: 'r' });
          const fileData2 = fileData1.split("\n");
          const endTimestamp = Number(fileData2[3]);
          if (Date.now() >= endTimestamp) {
            i += 2;
            if (i === 11) i = 1;
            const prize = fileData2[0];
            const numWinners = fileData2[1];
            const winnerRole = fileData2[5];
            const msgUrl = fileData2[13];
            fs.rename(`./giveaways/giveawayConfigs/${file}`, `./giveaways/giveawayConfigs/processing-${file}`, (e) => { if (e) console.log(e) });
            const entries1 = fs.readFileSync(`./giveaways/giveawayEntries/${file}`, { encoding: 'utf8', flag: 'r' });
            const entries2 = entries1.split("\n");
            let entries = shuffleArray(entries2);
            const locationString = file.slice(0, file.length - 4);
            const location = locationString.split("_");
            const channel = await client.guilds.cache.get(location[0]).channels.fetch(location[1]).catch((e) => { });
            const message = await channel.messages.fetch(location[2]).catch((e) => { });
            const guild = client.guilds.cache.get(location[0]);
            const members = await client.guilds.cache.get(location[0]).members.fetch().catch((e) => { });
            let walletsArray = [];
            let tagArray = [];
            if (entries.length === 1 && entries[0] === "") {
              if (message && channel) {
                const description = message.embeds[0].description;
                await message.edit({
                  components: [row],
                  embeds: [new EmbedBuilder().setTitle("Giveaway Ended").setDescription(description).setColor("#8A45FF")],
                });
                await message.reply({
                  content: "No Entries."
                });
                fs.unlinkSync(`./giveaways/giveawayConfigs/processing-${file}`);
                fs.unlinkSync(`./giveaways/giveawayEntries/${file}`);
              } else {
                fs.unlinkSync(`./giveaways/giveawayConfigs/processing-${file}`);
                fs.unlinkSync(`./giveaways/giveawayEntries/${file}`);
              };
            } else {
              let winners = [];
              const unique = findunique(entries);
              const walletData = await wallets_records.find({});
              do {
                const index = Math.floor(Math.random() * entries.length);
                if (!winners.includes(entries[index]) && entries[index]?.length) {
                  winners.push(entries[index]);
                  let member = members.find((mem) => mem.id === entries[index]);
                  if (!member) member = {
                    id: "NOT FOUND",
                    user: {
                      tag: "NOT FOUND"
                    }
                  };
                  const wallet = findWallet(walletData, entries[index], location[0]);
                  tagArray.push([wallet, member.id, member.user.tag]);
                  walletsArray.push([wallet]);
                }
              } while (winners.length < numWinners && winners.length < unique);
              winners = shuffleArray(winners);
              if (message && channel) {
                const description = message.embeds[0].description;
                if (message.embeds[0].image) {
                  await message.edit({
                    components: [row],
                    embeds: [new EmbedBuilder().setTitle("Giveaway Ended").setImage(message.embeds[0].image.url).setDescription(description).setColor("#8A45FF")],
                  });
                } else {
                  await message.edit({
                    components: [row],
                    embeds: [new EmbedBuilder().setTitle("Giveaway Ended").setDescription(description).setColor("#8A45FF")],
                  });
                };
                const splitted = splitWinners(winners, 70);
                const messages = messagesGenerator(splitted);
                let sent;
                if (unique !== entries.length) {
                  sent = await message.reply({
                    embeds: [new EmbedBuilder().setDescription(`:tada: Congratulations to all the **${prize}** winners! :tada:\n:bust_in_silhouette: Unique Entries: ${unique}\n:busts_in_silhouette: Total Entries: ${entries.length}\n\nThe winners are posted below! :fire:`).setColor("#8A45FF")],
                  });
                } else {
                  sent = await message.reply({
                    embeds: [new EmbedBuilder().setDescription(`:tada: Congratulations to all the **${prize}** winners! :tada:\n:bust_in_silhouette: Entries: ${unique}\n\nThe winners are posted below! :fire:`).setColor("#8A45FF")],
                  });
                };
                for (const msg of messages) {
                  await message.channel.send({
                    content: msg,
                  });
                };
                const workbook = new excel.Workbook();
                const workSheetOnlyWallets = workbook.addWorksheet('Wallets Only');
                const workSheetWalletsAndUserDetails = workbook.addWorksheet('Wallets With User Info');
                workSheetOnlyWallets.addRow(['Server Name:', guild.name]);
                workSheetOnlyWallets.addRow(['Prize Name:', prize]);
                workSheetOnlyWallets.addRow(['Wallet Address'])
                workSheetWalletsAndUserDetails.addRow(['Server Name:', guild.name]);
                workSheetWalletsAndUserDetails.addRow(['Prize Name:', prize]);
                workSheetWalletsAndUserDetails.addRow(['Wallet Address', 'User ID', 'User Tag']);
                tagArray.forEach((detailArray) => {
                  workSheetWalletsAndUserDetails.addRow(detailArray);
                });
                walletsArray.forEach((detailArray) => {
                  workSheetOnlyWallets.addRow(detailArray);
                });
                const bufferFile = await workbook.xlsx.writeBuffer();
                const config = await config_records.findOne({
                  server_id: guild.id,
                });
                const channelID = config.submit_channel;
                const postChannel = await client.guilds.cache.get(location[0]).channels.fetch(channelID).catch((e) => { });
                if (postChannel) {
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
                    let content = `\nThe file with winners' details and wallets is attached below!\n`;
                    if (unique !== entries.length) content = `Total Entries: ${entries.length}\n` + content;
                    const postDescription = `Giveaway Ended\n:gift: Prize: **${prize}**\n:medal: Number of Winners: **${numWinners}**\nUnique Entries: ${unique}\n${content}`;
                    await postChannel.send({
                      embeds: [new EmbedBuilder().setDescription(postDescription).setColor("#8A45FF")],
                      files: [{
                        attachment: bufferFile,
                        name: `${prize}_${guild.name}.xlsx`
                      }],
                      components: [messageLinkRow],
                    });
                  if (winnerRole !== "NA") {
                    let winnersDuplicate = winners;
                    const interval = setInterval(doRoles, 800);
                    async function giveRole(winnersDuplicate) {
                      if (winnersDuplicate.length) {
                        const member = members.find((m) => m.id === winnersDuplicate[winnersDuplicate.length - 1]);
                        winnersDuplicate.pop();
                        if (member) member.roles.add(winnerRole).catch((e) => { });
                      };
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
                } else {
                  fs.unlinkSync(`./giveaways/giveawayConfigs/processing-${file}`);
                  fs.unlinkSync(`./giveaways/giveawayEntries/${file}`);
                };
              } else {
                fs.unlinkSync(`./giveaways/giveawayConfigs/processing-${file}`);
                fs.unlinkSync(`./giveaways/giveawayEntries/${file}`);
              };
            };
          };
        };
      };
    };
    endGiveaways();
    setInterval(endGiveaways, 60 * 1000);

    async function checkSubs() {
      const subs = await sub_records.find();
      subs.forEach(async (sub) => {
        const end_timestamp = sub.end_timestamp;
        if (Date.now() < end_timestamp) return;
        await sub_records.deleteOne({
          server_id: sub.server_id,
        }).catch((e) => {
          console.log(e);
        });
        const config = await config_records.findOne({
          server_id: sub.server_id,
        }).catch((e) => {
          console.log(e);
        });
        if (!config) return;
        config.expired = true;
        config.expired_timestamp = Date.now();
        await config.save().catch((e) => { });
      });
      const configs = await config_records.find({
        expired: true,
      });
      configs.forEach(async (config) => {
        const timestamp = config.expired_timestamp;
        const diff = Date.now() - timestamp;
        if (diff < 1000 * 60 * 60 * 24 * 7) return;
        await config_records.deleteOne({
          server_id: config.server_id,
        }).catch((e) => {
          console.log(e);
        });
        await wallets_records.deleteMany({
          server_id: config.server_id,
        }).catch((e) => {
          console.log(e);
        });
      });
    };
    checkSubs();
    setInterval(checkSubs, 10 * 60 * 1000);
  },
};