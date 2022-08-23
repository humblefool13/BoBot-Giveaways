const fs = require("fs");
const config_records = require("../models/configurations.js");
const wallets_records = require("../models/wallets.js");
const sub_records = require("../models/subscriptions.js");
const Pastecord = require("pastecord");
const pasteClient = new Pastecord();
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ActivityType } = require("discord.js");
let i = 1;
async function pastecord(text) {
  let data = await pasteClient.publish(text).catch();
  if (!data) data = { "url": "Upload Failure" };
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
            fs.rename(`./giveaways/giveawayConfigs/${file}`, `./giveaways/giveawayConfigs/processing-${file}`, (e) => { if (e) console.log(e) });
            const entries1 = fs.readFileSync(`./giveaways/giveawayEntries/${file}`, { encoding: 'utf8', flag: 'r' });
            const entries2 = entries1.split("\n");
            const entries = shuffleArray(entries2);
            const locationString = file.slice(0, file.length - 4);
            const location = locationString.split("_");
            const channel = await client.guilds.cache.get(location[0]).channels.fetch(location[1]).catch((e) => { });
            const message = await channel.messages.fetch(location[2]).catch((e) => { });
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
              let winners = [];
              do {
                const index = Math.floor(Math.random() * entries.length);
                if (!winners.includes(entries[index]) && entries[index].length) {
                  winners.push(entries[index]);
                };
              } while (winners.length < numWinners && winners.length < unique);
              winners = shuffleArray(winners);
              if (message && channel) {
                const description = message.embeds[0].description;
                await message.edit({
                  components: [row],
                  embeds: [new EmbedBuilder().setTitle("Giveaway Ended").setDescription(description).setColor("#8A45FF").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
                });
                const splitted = splitWinners(winners, 70);
                const messages = messagesGenerator(splitted);
                messages.forEach(async (msg) => {
                  await message.channel.send({
                    content: msg,
                  }).then((sent) => { sent.delete().catch((e) => { }) }).catch((e) => { });
                });
                let sent;
                if (unique !== entries.length) {
                  sent = await message.reply({
                    embeds: [new EmbedBuilder().setDescription(`:tada: Congratulations to all the **${prize}** winners! :tada:\n:bust_in_silhouette: Unique Entries: ${unique}\n:busts_in_silhouette: Total Entries: ${entries.length}`).setColor("#8A45FF")],
                  });
                } else {
                  sent = await message.reply({
                    embeds: [new EmbedBuilder().setDescription(`:tada: Congratulations to all the **${prize}** winners! :tada:\n:bust_in_silhouette: Entries: ${unique}`).setColor("#8A45FF")],
                  });
                };
                for (const msg of messages) {
                  await message.channel.send({
                    embeds: [new EmbedBuilder().setDescription(msg).setColor("#8A45FF").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
                  });
                };
                const wallets = await wallets_records.find({
                  server_id: location[0],
                });
                const members = await client.guilds.cache.get(location[0]).members.fetch().catch((e) => { });
                const guild = client.guilds.cache.get(location[0]);
                let k = 0;
                let walletsArray = [];
                let tagArray = [];
                for (let winner of winners) {
                  const member = members.find((m) => m.id === winner) ? members.find((m) => m.id === winner) : { user: { tag: "Not Found" } };
                  const userWallet = wallets.find((saved) => saved.discord_id === winner) ? wallets.find((saved) => saved.discord_id === winner) : { wallet: "Not Submitted" };
                  walletsArray.push(`${++k}) ${userWallet.wallet}`);
                  tagArray.push(`${k}) ${userWallet.wallet} - ${member.user.tag}`);
                };
                const exportStringWallet = `Server Name: ${guild.name}\nPrize: ${prize}\n\nWallet Addresses of Winners\n\n${walletsArray.join("\n")}\n\n© BoBotLabs Giveaway Bot.`;
                const exportString = `Server Name: ${guild.name}\nPrize: ${prize}\n\n(Wallet Address + User Tag) of Winners\n\n${tagArray.join("\n")}\n\n© BoBotLabs Giveaway Bot.`;
                fs.writeFileSync(`./exports/export${i}.txt`, exportString);
                fs.writeFileSync(`./exports/export${i + 1}.txt`, exportStringWallet);
                const winnersTextUrl = await pastecord(exportString);
                const winnersWalletTextUrl = await pastecord(exportStringWallet);
                const config = await config_records.findOne({
                  server_id: location[0],
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
                  const content = `Link to winners list \`(User Tag + Wallet Addresses)\` :\n${winnersTextUrl}.txt\nLink to winners list \`(Only Wallet Addresses)\` :\n${winnersWalletTextUrl}.txt\n\n:rotating_light: Same content as files above.`;
                  const postDescription = `Giveaway Ended\n:gift: Prize: **${prize}**\n:medal: Number of Winners: **${numWinners}**\n\n${content}`;
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
                    embeds: [new EmbedBuilder().setDescription(postDescription).setColor("#8A45FF").setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" })],
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