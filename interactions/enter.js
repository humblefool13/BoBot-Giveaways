const fs = require("fs");
const fetch = require("node-fetch");
const crypto = require('crypto-js');
const wallets = require("../models/wallets.js");
const twitter = require('../models/twitter.js');
//const authRequest = require("twitter-v1-oauth").default;
const { EmbedBuilder } = require("discord.js");
function makeEmbed(messageEmbed, entries) {
  const embed = new EmbedBuilder()
    .setTitle(messageEmbed.title)
    .setDescription(messageEmbed.description)
    .setColor(messageEmbed.hexColor)
    .setFooter({ text: `${entries} Entries`, iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" });
  return embed;
};
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder()
    .setColor("#35FF6E")
    .setDescription(des);
  return embed;
};
function findunique(entries) {
  let unique = [];
  entries.forEach((entry) => {
    if (unique.includes(entry)) return;
    unique.push(entry);
  });
  return unique.length;
};
function encrypt(message) {
  const ciphertext = crypto.AES.encrypt(message, process.env['secret_code_crypto']).toString();
  return ciphertext;
};
function decrypt(ciphertext) {
  const bytes = crypto.AES.decrypt(ciphertext, process.env['secret_code_crypto']);
  const originalText = bytes.toString(crypto.enc.Utf)
  return originalText;
};
async function refreshDiscord(refreshToken) {
  const data = new URLSearchParams({
    client_id: '1001909973938348042',
    client_secret: process.env['client_discord_secret'],
    grant_type: "refresh_token",
    code: refreshToken,
  });
  const responseDiscord = await fetch(`https://discord.com/api/oauth2/token`, {
    method: "POST",
    body: data.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  });
  const resultDiscord = await responseDiscord.json();
  return resultDiscord;
};
async function memberInGuild(memberId, credentials, guildId) {
  let accessToken = decrypt(credentials.access_token_discord);
  let refreshToken = decrypt(credentials.refresh_token_discord);
  let body = new URLSearchParams({
    "access_token": accessToken,
  });
  let discordResponse = await fetch(`https://discordapp.com/api/v10/guilds/${guildId}/members/${memberId}`, {
    method: "PUT",
    body: body.toString(),
    headers: {
      'Authorization': `Bot ${process.env['bot_token']}`
    },
  });
  if (discordResponse.status !== 201 && discordResponse.status !== 204) {
    const newDiscordCreds = await refreshDiscord(refreshToken);
    accessToken = newDiscordCreds.access_token;
    refreshToken = newDiscordCreds.refresh_token;
    body = new URLSearchParams({
      "access_token": accessToken,
    });
    discordResponse = await fetch(`https://discordapp.com/api/v10/guilds/${guildId}/members/${memberId}`, {
      method: "PUT",
      body: body.toString(),
      headers: {
        'Authorization': `Bot ${process.env['bot_token']}`
      },
    });
  };
  const find = await twitter.findOne({
    discord_id: memberId,
  });
  find.access_token_discord = encrypt(accessToken);
  find.refresh_token_discord = encrypt(refreshToken);
  find.save().catch(e => console.Console.log(e));
  return;
};
/*
async function checkifFollows(code, secret, id, followReq) {
  let userAuths = oAuthOptions;
  userAuths.access_token = code;
  userAuths.access_token_secret = secret;
  const url = `https://api.twitter.com/1.1/friendships/show.json?source_id=${id}`;
  let follows = [];
  for (const account_id in followReq) {
    const url2 = url + `&target_id=${account_id}`;
    const method = "GET";
    const params = { q: "twitter bot" };
    const authorization = authRequest({ method, url2, params }, userAuths);
    const response = await fetch(urlStep1, {
      method,
      headers: {
        "Authorization": authorization,
      }
    });
    if (response.status !== 200) return [false, "err"];
    const result = await response.json();
    follows.push(result.target.followed_by);
  };
  const followsBool = !(follows.includes(false));
  return [followsBool, "none"];
};
function getTweetID(link) {
  const indexSlash = link.lastIndexOf("/");
  const indexQuestionIfAny = link.indexOf("?");
  if (indexQuestionIfAny !== -1) {
    return link.slice(indexSlash + 1, indexQuestionIfAny);
  } else {
    return link.slice(indexSlash + 1);
  };
};
async function checkIfRTed(code, secret, id, tweet_id) {
  let userAuths = oAuthOptions;
  userAuths.access_token = code;
  userAuths.access_token_secret = secret;
  const url = `https://api.twitter.com/2/users/${id}/retweets`;
  const method = "POST";
  const params = { q: "twitter bot" };
  const authorization = authRequest({ method, url, params }, userAuths);
  const response = await fetch(url, {
    method,
    body: {
      "tweet_id": tweet_id,
    },
    headers: {
      "Authorization": authorization,
    },
  });
  const result = await response.json();
  return result.data.retweeted;
};
async function checkIfLiked(code, secret, id, tweet_id) {
  let userAuths = oAuthOptions;
  userAuths.access_token = code;
  userAuths.access_token_secret = secret;
  const url = `https://api.twitter.com/2/users/${id}/likes`;
  const method = "POST";
  const params = { q: "twitter bot" };
  const authorization = authRequest({ method, url, params }, userAuths);
  const response = await fetch(url, {
    method,
    body: {
      "tweet_id": tweet_id,
    },
    headers: {
      "Authorization": authorization,
    },
  });
  const result = await response.json();
  return result.data.liked;
};*/

module.exports = {
  name: "enter",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const giveawaysConfigsDir = fs.readdirSync("./giveaways/giveawayConfigs");
      const giveawaysEntriesDir = fs.readdirSync("./giveaways/giveawayEntries");
      const giveawayConfigsFile = giveawaysConfigsDir.find((file) => file.includes(interaction.guildId) && file.includes(interaction.channelId) && file.includes(interaction.message.id));
      const giveawayEntriesFile = giveawaysEntriesDir.find((file) => file.includes(interaction.guildId) && file.includes(interaction.channelId) && file.includes(interaction.message.id));
      if (!giveawayEntriesFile || !giveawayConfigsFile) return interaction.editReply("invalid/unknown giveaway");
      const giveawayConfig = fs.readFileSync(`./giveaways/giveawayConfigs/${giveawayConfigsFile}`, { encoding: 'utf8', flag: 'r' });
      const giveawayEntries = fs.readFileSync(`./giveaways/giveawayEntries/${giveawayEntriesFile}`, { encoding: 'utf8', flag: 'r' });
      let entries = [];
      if (giveawayEntries.length) {
        entries = giveawayEntries.split("\n");
        if (entries.includes(interaction.member.id)) return interaction.editReply({ embeds: [MakeEmbedDes("You have already entered this giveaway.")] });
      } else {
        entries = [];
      };
      let walletAddress;
      const configs = giveawayConfig.split("\n");
      const walletReq = configs[2];
      const reqRoles = configs[6];
      const blacklistRoles = configs[7];
      const bonus = configs[8];
      const followReq = configs[9];
      const rtReq = configs[11];
      const likeReq = configs[10];
      const discordMemberReq = configs[12];
      let bonusApplicable = "", userEntries = 1;
      if (walletReq === "YES") {
        const wallet = await wallets.findOne({
          discord_id: interaction.user.id,
        });
        if (!wallet) return interaction.editReply("You need to either save a global or a server wallet to enter this giveaway.");
        const serverWallets = wallet.wallets;
        const serverWallet = serverWallets.find((el) => el[0] === interaction.guildId);
        if (!serverWallet && wallet.wallet_global === "Not Submitted Yet.") return interaction.editReply("You need to either save a global or a server wallet to enter this giveaway.");
        if (serverWallet) {
          walletAddress = serverWallet[1];
        } else {
          walletAddress = wallet.wallet_global;
        };
      };
      const memberRoles = interaction.member.roles.cache;
      if (reqRoles !== "NA") {
        const req_roles = reqRoles.split(",");
        let reqFound = false;
        req_roles.forEach((roleId) => {
          if (memberRoles.has(roleId)) reqFound = true;
        });
        if (!reqFound) return interaction.editReply({ embeds: [MakeEmbedDes(`You do not have any of the required roles to enter this giveaway.`)] });
      };
      if (blacklistRoles !== "NA") {
        const black_roles = blacklistRoles.split(",");
        let blackFound = false;
        black_roles.forEach((roleId) => {
          if (memberRoles.has(roleId)) blackFound = true;
        });
        if (blackFound) return interaction.editReply({ embeds: [MakeEmbedDes(`You are blacklisted from entering the giveaway since you have one or more of the blacklisted roles.`)] });
      };
      if (bonus !== "NA") {
        const roleStrings = bonus.split(",");
        roleStrings.forEach((roleString) => {
          const roleAndEntries = roleString.split("-");
          const roleID = roleAndEntries[0];
          const entry = Number(roleAndEntries[1]);
          if (memberRoles.has(roleID)) {
            userEntries += entry;
            bonusApplicable = bonusApplicable + `<@&${roleID}> = +${entry} Entries\n`;
          };
        });
      };
      const creds = await twitter.findOne({
        discord_id: interaction.user.id,
      });
      if (discordMemberReq != "NA") {
        if (!creds) {
          return interaction.editReply({
            content: 'This giveaway requires you to verify twitter account so please do so to enter.'
          });
        };
        await memberInGuild(interaction.user.id, creds, discordMemberReq);
      };
      /*
      const twitterDB = await twitter.findOne({
        discord_id: interaction.member.id,
      }).catch();
      const code = twitterDB.oauth_token;
      const secret = twitterDB.outh_token_secret;
      const id = twitterDB.twitter_id;
      if (followReq !== "NA") {
        if (!twitterDB) return interaction.editReply({
          content: "This giveaway has some twitter requirement(s). Please verify your twitter account in order to enter this giveaway. You can find the verification button right next to the button you submitted your wallet address in.",
          components: [],
          embeds: [],
        });
        const follows = await checkifFollows(code, secret, id, followReq);
        if (follows[1] === 'none' && !follows[0]) {
          return interaction.editReply({
            content: "You do not follow the required accounts on twitter. Please do so and try entering again",
            components: [],
            embeds: []
          });
        } else if (follows[1] === 'err') {
          return interaction.editReply({
            content: "Something went wrong. Please try again later.",
            components: [],
            embeds: []
          });
        };
      };
      if (rtReq !== "NA") {
        if (!twitterDB) return interaction.editReply({
          content: "This giveaway has some twitter requirement(s). Please verify your twitter account in order to enter this giveaway. You can find the verification button right next to the button you submitted your wallet address in.",
          components: [],
          embeds: [],
        });
        const tweet_id = getTweetID(rtReq);
        const rted = await checkIfRTed(code, secret, id, tweet_id);
        if (!rted) {
          return interaction.editReply({
            content: `Please complete the twitter retweet requirement by retweeting this tweet -\n\n<${rtReq}>`,
            components: [],
            embeds: []
          });
        };
      }
      if (likeReq !== "NA") {
        if (!twitterDB) return interaction.editReply({
          content: "This giveaway has some twitter requirement(s). Please verify your twitter account in order to enter this giveaway. You can find the verification button right next to the button you submitted your wallet address in.",
          components: [],
          embeds: [],
        });
        const tweet_id = getTweetID(likeReq);
        const liked = await checkIfLiked(code, secret, id, tweet_id);
        if (!liked) {
          return interaction.editReply({
            content: `Please complete the twitter like requirement by liking this tweet -\n\n<${likeReq}>`,
            components: [],
            embeds: []
          });
        };
      };*/
      for (i = 1; i <= userEntries; i++) {
        entries.push(interaction.member.id);
      };
      const entriesString = entries.join("\n");
      fs.writeFileSync(`./giveaways/giveawayEntries/${giveawayEntriesFile}`, entriesString);
      const locationString = giveawayConfigsFile.slice(0, giveawayConfigsFile.length - 4);
      const location = locationString.split("_");
      const channel = await client.guilds.cache.get(location[0]).channels.fetch(location[1]);
      const uniqueEntries = findunique(entries);
      const message = await channel.messages.fetch(location[2]);
      const embed = makeEmbed(message.embeds[0], uniqueEntries);
      await message.edit({
        embeds: [embed],
        components: message.components,
      });
      let replyContent;
      if (bonusApplicable) {
        replyContent = `You have successfully entered this giveaway!\nYou have a total of ${userEntries} entry/entries:\n${bonusApplicable}\nGoodluck! :slight_smile:`;
      } else {
        replyContent = `You have successfully entered this giveaway!\nYou have a total of ${userEntries} entry/entries!\nGoodluck! :slight_smile:`;
      };
      return interaction.editReply({
        embeds: [MakeEmbedDes(replyContent)],
      });
    } catch (e) {
      console.log(e);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "I am facing some trouble, the dev has been informed. Please try again in some hours.",
          embeds: [],
          components: [],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "I am facing some trouble, the dev has been informed. Please try again in some hours.",
          embeds: [],
          components: [],
          ephemeral: true,
        });
      };
      client.users.cache.get("727498137232736306").send(`${client.user.username} has trouble in enter.js -\n\n${e}`);
    };
  }
}