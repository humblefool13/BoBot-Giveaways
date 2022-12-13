const fs = require("fs");
const { BigNumber } = require("ethers");
const config_records = require("../models/configurations.js");
const { RateLimiter } = require("limiter");
const wallets_records = require("../models/wallets.js");
const sub_records = require("../models/subscriptions.js");
const Pastecord = require("pastecord");
let etherscan_key = process.env['etherscan_key'];
etherscan_key = etherscan_key.split(",");
let eklength = etherscan_key.length;
let ekv = 0;
const limiter_eth = new RateLimiter({
  tokensPerInterval: 5 * eklength,
  interval: "second",
  fireImmediately: true
});
const pasteClient = new Pastecord();
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ActivityType, InteractionCollector } = require("discord.js");
const wallets = require("../models/wallets.js");
let i = 1;
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
async function getBalances(url) {
  const remainingRequests = await limiter_eth.removeTokens(1);
  if (remainingRequests < 0) return;
  if (ekv === eklength) ekv = 0;
  const balanceResponse = await fetch(url);
  const balanceResult = await balanceResponse.json();
  return balanceResult;
};
async function filterInEligibleEntries(entries, balReq, guildId) {
  let balanceRequired = BigNumber.from(balReq * Math.pow(10, 6));
  for (i = 1; i <= 12; i++) {
    balanceRequired = balanceRequired.mul(BigNumber.from("10"));
  };
  let profiles = [];
  entries.forEach(async (profile) => {
    let requiredWallet = "";
    const walletData = await wallets_records.findOne({
      discord_id: profile,
    });
    const guildWallets = walletData.wallets;
    if (guildWallets === "Not Saved Yet.") {
      requiredWallet = walletData.wallet_global;
    } else {
      const guildWalletData = guildWallets.find((data) => data[0] === guildId);
      if (guildWalletData) {
        requiredWallet = guildWalletData[1];
      } else {
        requiredWallet = walletData.wallet_global;
      };
    };
    profiles.push([profile, requiredWallet]);
  });
  for (i = 0; i < profiles.length; i += 20) {
    let wallets = [];
    for (j = i; j < i + 20 && j < profiles.length; j++) {
      const profile = profiles[j];
      wallets.push(profile[1].toLowerCase());
    };
    const url = `https://api.etherscan.io/api?module=account&action=balancemulti&address=${wallets.join(",")}&tag=latest&apikey=${etherscan_key[ekv++]}`;
    let response;
    do {
      response = await getBalances(url);
    } while (!response || response.message !== "OK")
    const result = response.result;
    result.forEach((balanceProfile) => {
      const account = balanceProfile.account;
      const balance = balanceProfile.balance;
      const element = profiles.find((el) => el[1].toLowerCase() === account.toLowerCase());
      const index = profiles.indexOf(element);
      profiles[index] = [element[0], element[1], BigNumber.from(balance)];
    });
  };
  const eligibleProfiles = profiles.filter(el => el[2].gt(balanceRequired));
  const entriesArray = eligibleProfiles.map(el => el[0]);
  const walletArray = eligibleProfiles.map(el => el[1]);
  return [entriesArray, walletArray];
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
          const endTimestamp = Number(fileData2[2]);
          if (Date.now() >= endTimestamp) {
            i += 2;
            if (i === 11) i = 1;
            const prize = fileData2[0];
            const numWinners = fileData2[1];
            const winnerRole = fileData2[3];
            const msgUrl = fileData2[8];
            const balReq = fileData2[4];
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
                  embeds: [new EmbedBuilder().setTitle("Giveaway Ended").setDescription(description).setColor("#8A45FF").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
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
              const unique = findunique(entries);
              let functionReturn = await filterInEligibleEntries(entries, balReq, guild.id);
              entries = functionReturn[0];
              wallets = functionReturn[1];
              do {
                const index = Math.floor(Math.random() * entries.length);
                if (!winners.includes(entries[index]) && entries[index].length) {
                  winners.push(entries[index]);
                  walletsArray.push(wallets[index]);
                  const member = members.find((mem) => mem.id === entries[index]);
                  if (!member) member = {
                    id: "NOT FOUND",
                    user: {
                      tag: "NOT FOUND"
                    }
                  };
                  tagArray.push(`${wallets[index]} - ${member.id} - ${member.user.tag}`);
                };
              } while (winners.length < numWinners && winners.length < unique);
              winners = shuffleArray(winners);
              const exportStringWallet = `Server Name: ${guild.name}\nPrize: ${prize}\n\nWallet Addresses of Winners\n\n${walletsArray.join("\n")}`;
              const exportString = `Server Name: ${guild.name}\nPrize: ${prize}\n\n(Wallet Address + User Info) of Winners\n\n${tagArray.join("\n")}`;
              if (message && channel) {
                const description = message.embeds[0].description;
                await message.edit({
                  components: [row],
                  embeds: [new EmbedBuilder().setTitle("Giveaway Ended").setDescription(description).setColor("#8A45FF").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
                });
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
                fs.writeFileSync(`./exports/export${i}.txt`, exportString);
                fs.writeFileSync(`./exports/export${i + 1}.txt`, exportStringWallet);
                const winnersTextUrl = await pastecord(exportString);
                const winnersWalletTextUrl = await pastecord(exportStringWallet);
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
                  let content = `Link to winners list \`(User Tag + Wallet Addresses)\` :\n${winnersTextUrl}.txt\nLink to winners list \`(Only Wallet Addresses)\` :\n${winnersWalletTextUrl}.txt\n\nUnique Entries: ${unique}`;
                  if (unique !== entries.length) content = content + `\nTotal Entries: ${entries.length}`;
                  const postDescription = `Giveaway Ended\n:gift: Prize: **${prize}**\n:medal: Number of Winners: **${numWinners}**\n\n${content}`;
                  if (!winnersTextUrl || !winnersWalletTextUrl) {
                    await postChannel.send({
                      files: [{
                        attachment: `./exports/export${i}.txt`,
                        name: `Tags-${guild.name.toLowerCase().replaceAll(" ", "")}_${prize.toLowerCase().replaceAll(" ", "")}.txt`,
                        description: 'File with winners\' data.'
                      }, {
                        attachment: `./exports/export${i + 1}.txt`,
                        name: `Wallets-${guild.name.toLowerCase().replaceAll(" ", "")}_${prize.toLowerCase().replaceAll(" ", "")}.txt`,
                        description: 'File with winners\' wallet data.'
                      }],
                      components: [messageLinkRow],
                      embeds: [new EmbedBuilder().setDescription(`Giveaway Ended\n:gift: Prize: **${prize}**\n:medal: Number of Winners: **${numWinners}**\n\nFailed to upload to pastecord. Files sent above.`).setColor("#8A45FF").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
                    });
                  } else {
                    await postChannel.send({
                      components: [messageLinkRow],
                      embeds: [new EmbedBuilder().setDescription(postDescription).setColor("#8A45FF").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
                    });
                  };
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