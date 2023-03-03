const fs = require("fs");
const config_records = require("../models/configurations.js");
const wallets_records = require("../models/wallets.js");
const winners_records = require("../models/winners.js");
const sub_records = require("../models/subscriptions.js");
const socials = require("../models/twitter.js");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ActivityType } = require("discord.js");
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
function findWallet(walletData, userId, guildId, chain) {
  for (let i in walletData) {
    const userAccount = walletData[i];
    if (userAccount.discord_id === userId) {
      let guildWallets = '';
      if (chain === "Ethereum") {
        guildWallets = userAccount.wallets_eth;
        const find = guildWallets.find((el => el[0] === guildId));
        if (find) {
          return find[1];
        } else {
          return (userAccount.wallet_global_eth) ? (userAccount.wallet_global_eth) : "Not Found.";
        }
      } else if (chain === "Solana") {
        guildWallets = userAccount.wallets_sol;
        const find = guildWallets.find((el => el[0] === guildId));
        if (find) {
          return find[1];
        } else {
          return (userAccount.wallet_global_sol) ? (userAccount.wallet_global_sol) : "Not Found.";
        }
      } else if (chain === "Aptos") {
        guildWallets = userAccount.wallets_apt;
        const find = guildWallets.find((el => el[0] === guildId));
        if (find) {
          return find[1];
        } else {
          return (userAccount.wallet_global_apt) ? (userAccount.wallet_global_apt) : "Not Found.";
        }
      } else if (chain === "MultiversX") {
        guildWallets = userAccount.wallets_mulx;
        const find = guildWallets.find((el => el[0] === guildId));
        if (find) {
          return find[1];
        } else {
          return (userAccount.wallet_global_mulx) ? (userAccount.wallet_global_mulx) : "Not Found.";
        }
      };
    };
  };
  return 'Not Found.';
};
const rowExport = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Format:")
      .setCustomId("exportFormat")
      .setDisabled(true)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel("1")
      .setCustomId("exportA")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel("2")
      .setCustomId("exportB")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel("3")
      .setCustomId("exportC")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setLabel("4")
      .setCustomId("exportD")
      .setStyle(ButtonStyle.Primary)
  );
const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
function getMonthNumberFromName(monthName) {
  switch (monthName.toLowerCase()) {
    case "jan":
    case "january":
      return '1';
    case "feb":
    case "february":
      return '2';
    case 'march':
    case 'mar':
      return '3';
    case 'april':
    case 'apr':
      return '4';
    case 'may':
      return '5';
    case 'june':
    case 'jun':
      return '6';
    case 'july':
    case 'jul':
      return '7';
    case 'august':
    case 'aug':
      return '8';
    case 'september':
    case 'sep':
      return '9';
    case 'october':
    case 'oct':
      return '10';
    case 'november':
    case 'nov':
      return '11';
    case 'december':
    case 'dec':
      return '12';
    default:
      const datenow = new Date;
      const month = datenow.getMonth();
      return (month + 1).toString();
  }
};
function parseTimestamp(mintTime, timezone) {
  if (mintTime.toLowerCase() === 'na') return Date.now() + 40 * 24 * 60 * 60 * 1000;
  const params = mintTime.split(" ");
  const date = params[0];
  const year = '2023';
  const month = getMonthNumberFromName(params[1]);
  const time = params[2] + ":00";
  let timestampString = `${date}/${month}/${year} ${time}`;
  if (timezone === 'utc') {
    const dateOfIt = new Date(timestampString);
    const timestamp = dateOfIt.getTime();
    return timestamp;
  } else if (timezone === 'est') {
    timestampString += ` GMT-0500`;
    const dateOfIt = new Date(timestampString);
    const timestamp = dateOfIt.getTime();
    return timestamp;
  } else if (timezone === 'cet') {
    timestampString += ` GMT+0100`;
    const dateOfIt = new Date(timestampString);
    const timestamp = dateOfIt.getTime();
    return timestamp;
  } else if (timezone === 'cst') {
    timestampString += ` GMT+0800`;
    const dateOfIt = new Date(timestampString);
    const timestamp = dateOfIt.getTime();
    return timestamp;
  };
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
            const prize = fileData2[0];
            const config = await config_records.findOne({
              server_id: guild.id,
            });
            const numWinners = fileData2[1];
            const winnerRole = fileData2[5];
            const msgUrl = fileData2[13];
            const chain = fileData2[15];
            fs.rename(`./giveaways/giveawayConfigs/${file}`, `./giveaways/giveawayConfigs/processing-${file}`, (e) => { if (e) console.log(e) });
            const entries1 = fs.readFileSync(`./giveaways/giveawayEntries/${file}`, { encoding: 'utf8', flag: 'r' });
            const entries2 = entries1.split("\n");
            let entries = shuffleArray(entries2);
            const locationString = file.slice(0, file.length - 4);
            const location = locationString.split("_");
            const mintTime = fileData2[14];
            const channel = await client.guilds.cache.get(location[0]).channels.fetch(location[1]).catch((e) => { });
            const message = await channel.messages.fetch(location[2]).catch((e) => { });
            const guild = client.guilds.cache.get(location[0]);
            const members = await client.guilds.cache.get(location[0]).members.fetch().catch((e) => { });
            let walletTagIDTwitterArray = [];
            if (entries.length === 1 && entries[0] === "") {
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
                  const wallet = findWallet(walletData, entries[index], location[0], chain);
                  let twitterUsername = await socials.findOne({
                    discord_id: entries[index]
                  });
                  if (twitterUsername) {
                    twitterUsername = twitterUsername.twitter_username;
                  } else {
                    twitterUsername = 'Account not connected.'
                  };
                  walletTagIDTwitterArray.push([wallet, member.user.tag, member.id, twitterUsername]);
                }
              } while (winners.length < numWinners && winners.length < unique);
              const entryString = unique;
              const exportID = genRanHex(12);
              const mintTimestamp = parseTimestamp(mintTime, config.server_timezone.toLowerCase());
              await new winners_records({
                guild_id: location[0],
                prize_name: prize,
                entries: entryString,
                messageLink: message.url,
                deleteTimestamp: Date.now() + 30 * 24 * 60 * 60 * 1000,
                reminderTimestamp: mintTimestamp - 10 * 60 * 1000,
                exportID: exportID,
                winnersData: walletTagIDTwitterArray,
              }).save().catch();
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
                const winnerChannel = await client.guilds.cache.get(location[0]).channels.fetch(config.winners_channel).catch((e) => { });
                let sent;
                if (unique !== entries.length) {
                  sent = await winnerChannel.send({
                    embeds: [new EmbedBuilder().setDescription(`:tada: Congratulations to all the **${prize}** winners! :tada:\n:bust_in_silhouette: Unique Entries: ${unique}\n:busts_in_silhouette: Total Entries: ${entries.length}\n\nThe winners are posted below! :fire:`).setColor("#8A45FF")],
                  });
                } else {
                  sent = await winnerChannel.send({
                    embeds: [new EmbedBuilder().setDescription(`:tada: Congratulations to all the **${prize}** winners! :tada:\n:bust_in_silhouette: Entries: ${unique}\n\nThe winners are posted below! :fire:`).setColor("#8A45FF")],
                  });
                };
                for (const msg of messages) {
                  await winnerChannel.send({
                    content: msg,
                  });
                };
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
                  let postDescription = `Giveaway Ended\n:gift: Prize: **${prize}**\n:medal: Number of Winners: **${numWinners}**\n👤 Unique Entries: ${unique}`;
                  if (unique !== entries.length) {
                    postDescription += `\n👥 Total Entries: ${entries.length}`;
                  };
                  postDescription += '\n\nYou can export winners\'s data in 4 formats using buttons below:\n1) Wallet Address of Winners Only\n2) Wallet Address and Discord User Tag of Winners Only\n3) Wallet Address, Discord ID and Discord User Tag of Winners\n4) Wallet Address, Discord ID, Discord User Tag and Twitter Username of Winners.\n\nYou can export anytime in upcoming 30 days.';
                  await postChannel.send({
                    embeds: [new EmbedBuilder().setDescription(postDescription).setColor("#8A45FF").setFooter({ text: exportID })],
                    components: [rowExport, messageLinkRow],
                  });
                  if (winnerRole !== "NA") {
                    for (let winner in winners) {
                      winner.roles.add(winnerRole).catch((e) => { });
                    };
                  };
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

    async function deleteWinners() {
      const winnersData = await winners_records.find();
      winnersData.forEach(async (giveawayProfile) => {
        const guildId = giveawayProfile.guild_id;
        const prizeName = giveawayProfile.prize_name;
        const deleteTimestamp = giveawayProfile.deleteTimestamp;
        if (Date.now() >= deleteTimestamp) {
          await winners_records.deleteOne({
            guild_id: guildId,
            prize_name: prizeName,
          }).catch((e) => {
            console.log(e);
          });
        };
      });
    };
    deleteWinners();
    setInterval(deleteWinners, 60 * 1000);

    async function sendReminders() {
      const winners_data = await winners_records.find();
      winners_data.forEach(async (giveawayWinnerData) => {
        const reminderTimestamp = giveawayWinnerData.reminderTimestamp;
        if (reminderTimestamp <= Date.now()) {
          const configs = await config_records.findOne({
            server_id: giveawayWinnerData.guild_id,
          });
          const winnerChannel = await client.guilds.cache.get(giveawayWinnerData.guild_id).channels.fetch(configs.winners_channel);
          let winnersID = giveawayWinnerData.winnersData.map((el) => el[2]);
          const jumpButton = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setTitle("Jump To GIveaway")
                .setStyle(ButtonStyle.Link)
                .setURL(giveawayWinnerData.messageLink)
            );
          let description = `⏰ REMINDER ⏰\n**${giveawayWinnerData.prize_name}** is minting soon - <t:${ParseInt((giveawayWinnerData.reminderTimestamp + 10 * 60 * 1000) / 1000)}:R>\n\n<@${winnersID.join(">, <@")}>`;
          await winnerChannel.send({
            content: description,
            components: [jumpButton],
          });
        };
      });
    };
    sendReminders();
    setInterval(sendReminders, 60 * 1000);

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
      });
    };
    checkSubs();
    setInterval(checkSubs, 10 * 60 * 1000);
  },
};