const fs = require("fs");
const fetch = require("node-fetch");
const { Client: sdk } = require('twitter-api-sdk')
const wallets = require("../models/wallets.js");
const twitter = require('../models/twitter.js');
const { EmbedBuilder } = require("discord.js");
let oAuthOptions = {
  api_key: process.env.TWITTER_API_KEY || "",
  api_secret_key: process.env.TWITTER_API_SECRET_KEY || "",
  access_token_secret: "",
};
const crypto = require("crypto");
function signHmacSha512(key, str) {
  let hmac = crypto.createHmac("sha512", key);
  let signed = hmac.update(Buffer.from(str, 'utf-8')).digest('binary');
  return signed;
}
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
function randomString(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
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
async function refreshTwitterCreds(refreshToken) {
  const responseTwitter = await fetch(`https://api.twitter.com/2/oauth2/token?refresh_token=${refreshToken}&grant_type=refresh_token`, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      'Authorization': `Basic ${(process.env["auth_token"]).replaceAll(`"`, "")}`,
    },
    method: "POST"
  });
  const resultTwitter = await responseTwitter.json();
  return resultTwitter;
};
async function memberInGuild(memberId, credentials, guildId) {
  let accessToken = credentials.access_token_discord;
  let refreshToken = credentials.refresh_token_discord;
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
    const find = await twitter.findOne({
      discord_id: memberId,
    });
    find.access_token_discord = accessToken;
    find.refresh_token_discord = refreshToken;
    await find.save().catch(e => console.log(e));
  };
  if (discordResponse.status === 201 || discordResponse.status === 204) {
    return true;
  } else {
    return false;
  };
};
async function retweet(creds, tweetId) {
  const twitter_id = creds.twitter_id;
  let accessTokenTwitter = creds.access_token_twitter;
  let refreshTokenTwitter = creds.refresh_token_twitter;
  const body = {
    tweet_id: tweetId,
  };
  let twitterResponse = await fetch(`https://api.twitter.com/2/users/${twitter_id}/retweets`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      'Authorization': `Bearer ${accessTokenTwitter}`,
      'content-type': 'application/json',
    },
  });
  let twitterResult = await twitterResponse.json();
  if (twitterResult?.data?.retweeted) {
    return true;
  } else {
    const newTokens = await refreshTwitterCreds(refreshTokenTwitter);
    accessTokenTwitter = newTokens.access_token;
    refreshTokenTwitter = newTokens.refresh_token;
    twitterResponse = await fetch(`https://api.twitter.com/2/users/${twitter_id}/retweets`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        'Authorization': `Bearer ${accessTokenTwitter}`,
        'content-type': 'application/json',
      },
    });
    twitterResult = await twitterResponse.json();
    const find = await twitter.findOne({
      twitter_id: twitter_id,
    });
    find.access_token_twitter = accessTokenTwitter;
    find.refresh_token_twitter = refreshTokenTwitter;
    await find.save().catch(e => console.log(e));
    if (twitterResult?.data?.retweeted) {
      return true;
    } else {
      return false;
    };
  };
};
async function like(creds, tweetId) {
  const twitter_id = creds.twitter_id;
  let accessTokenTwitter = creds.access_token_twitter;
  let refreshTokenTwitter = creds.refresh_token_twitter;
  const body = {
    tweet_id: tweetId,
  };
  let twitterResponse = await fetch(`https://api.twitter.com/2/users/${twitter_id}/likes`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      'Authorization': `Bearer ${accessTokenTwitter}`,
      'content-type': 'application/json',
    },
  });
  let twitterResult = await twitterResponse.json();
  if (twitterResult?.data?.liked) {
    return true;
  } else {
    const newTokens = await refreshTwitterCreds(refreshTokenTwitter);
    accessTokenTwitter = newTokens.access_token;
    refreshTokenTwitter = newTokens.refresh_token;
    let twitterResponse = await fetch(`https://api.twitter.com/2/users/${twitter_id}/likes`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        'Authorization': `Bearer ${accessTokenTwitter}`,
        'content-type': 'application/json',
      },
    });
    let twitterResult = await twitterResponse.json();
    const find = await twitter.findOne({
      twitter_id: twitter_id,
    });
    find.access_token_twitter = accessTokenTwitter;
    find.refresh_token_twitter = refreshTokenTwitter;
    await find.save().catch(e => console.log(e));
    if (twitterResult?.data?.liked) {
      return true;
    } else {
      return false;
    };
  };
};
async function follow(creds, targetIDs_separated) {
  const twitter_id = creds.twitter_id;
  let accessTokenTwitter = creds.access_token_twitter;
  let refreshTokenTwitter = creds.refresh_token_twitter;
  const userIds = targetIDs_separated.split("_");
  let followSuccess = [];
  let refreshed = false;
  for (let userId in userIds) {
    const body = {
      target_user_id: userId,
    };
    let twitterResponse = await fetch(`https://api.twitter.com/2/users/${twitter_id}/following`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        'Authorization': `Bearer ${accessTokenTwitter}`,
        'content-type': 'application/json',
      },
    });
    let twitterResult = await twitterResponse.json();
    if (twitterResult?.data?.following || twitterResponse?.data?.pending_follow) {
      followSuccess.push(true);
    } else {
      const newTokens = await refreshTwitterCreds(refreshTokenTwitter);
      refreshed = true;
      accessTokenTwitter = newTokens.access_token;
      refreshTokenTwitter = newTokens.refresh_token;
      twitterResponse = await fetch(`https://api.twitter.com/2/users/${twitter_id}/following`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          'Authorization': `Bearer ${accessTokenTwitter}`,
          'content-type': 'application/json',
        },
      });
      twitterResult = await twitterResponse.json();
      const find = await twitter.findOne({
        twitter_id: twitter_id,
      });
      find.access_token_twitter = accessTokenTwitter;
      find.refresh_token_twitter = refreshTokenTwitter;
      await find.save().catch(e => console.log(e));
      if (twitterResult?.data?.following || twitterResponse?.data?.pending_follow) {
        followSuccess.push(true);
      } else {
        followSuccess.push(false);
      };
    };
  };
  for (let status in followSuccess) {
    if (!status) return false;
  };
  return true;
};

module.exports = {
  name: "enter",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const giveawaysConfigsDir = fs.readdirSync("./giveaways/giveawayConfigs");
      const giveawaysEntriesDir = fs.readdirSync("./giveaways/giveawayEntries");
      const giveawayConfigsFile = giveawaysConfigsDir.find((file) => file.includes(interaction.guildId) && file.includes(interaction.channelId) && file.includes(interaction.message.id));
      const giveawayEntriesFile = giveawaysEntriesDir.find((file) => file.includes(interaction.guildId) && file.includes(interaction.channelId) && file.includes(interaction.message.id));
      if (!giveawayEntriesFile || !giveawayConfigsFile) return interaction.editReply("Invalid/unknown giveaway");
      const giveawayConfig = fs.readFileSync(`./giveaways/giveawayConfigs/${giveawayConfigsFile}`, { encoding: 'utf8', flag: 'r' });
      const giveawayEntries = fs.readFileSync(`./giveaways/giveawayEntries/${giveawayEntriesFile}`, { encoding: 'utf8', flag: 'r' });
      let entries = [];
      if (giveawayEntries.length) {
        entries = giveawayEntries.split("\n");
        if (entries.includes(interaction.member.id)) return interaction.editReply({ embeds: [MakeEmbedDes("You have already entered this giveaway.")] });
      } else {
        entries = [];
      };
      let walletAddress = '';
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
      if (discordMemberReq != "NA") {
        const creds = await twitter.findOne({
          discord_id: interaction.user.id,
        });
        if (!creds) {
          return interaction.editReply({
            content: 'This giveaway requires you to verify twitter account so please do so to enter.'
          });
        };
        const member = await memberInGuild(interaction.user.id, creds, discordMemberReq);
        if (!member) {
          return interaction.editReply({
            content: 'Something went wrong. Please join the required server and try again later.'
          });
        };
      };
      if (followReq !== "NA") {
        const creds = await twitter.findOne({
          discord_id: interaction.user.id,
        });
        if (!creds) {
          return interaction.editReply({
            content: 'This giveaway requires you to verify twitter account so please do so to enter.'
          });
        };
        const followed = await follow(creds, followReq);
        if (!followed) {
          return interaction.editReply({
            content: 'Something went wrong. Please follow the required twitter accounts and try again later.'
          });
        };
      };
      if (likeReq !== "NA") {
        const creds = await twitter.findOne({
          discord_id: interaction.user.id,
        });
        if (!creds) {
          return interaction.editReply({
            content: 'This giveaway requires you to verify twitter account so please do so to enter.'
          });
        };
        let tweetId;
        if (!likeReq.includes("?")) {
          tweetId = likeReq.slice(likeReq.lastIndexOf("/") + 1, likeReq.length);
        } else {
          tweetId = likeReq.slice(likeReq.lastIndexOf("/") + 1, likeReq.indexOf("?"));
        };
        const liked = await like(creds, tweetId);
        if (!liked) {
          return interaction.editReply({
            content: 'Something went wrong. Please like the required tweet and try again later.'
          });
        };
      };
      if (rtReq !== "NA") {
        const creds = await twitter.findOne({
          discord_id: interaction.user.id,
        });
        if (!creds) {
          return interaction.editReply({
            content: 'This giveaway requires you to verify twitter account so please do so to enter.'
          });
        };
        let tweetId;
        if (!rtReq.includes("?")) {
          tweetId = rtReq.slice(rtReq.lastIndexOf("/") + 1, rtReq.length);
        } else {
          tweetId = rtReq.slice(rtReq.lastIndexOf("/") + 1, rtReq.indexOf("?"));
        };
        const rted = await retweet(creds, tweetId);
        if (!rted) {
          return interaction.editReply({
            content: 'Something went wrong. Please retweet the required tweet and try again later.'
          });
        };
      };
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
      if (bonusApplicable.length) {
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



/*const url = `https://api.twitter.com/2/users/${twitter_id}/following`;
  let string = '';
  const nonce = randomString(42);
  string += `${percentEncode('id')}=${percentEncode(twitter_id)}`;
  string += `&${percentEncode('oauth_consumer_key')}=${percentEncode(oAuthOptions.api_key)}`;
  string += `&${percentEncode('oauth_nonce')}=${percentEncode(nonce)}`;
  string += `&${percentEncode('oauth_signature_method')}=${percentEncode('HMAC - SHA1')}`;
  string += `&${percentEncode('oauth_timestamp')}=${percentEncode(`${Math.floor(Date.now() / 1000)}`)}`;
  string += `&${percentEncode('oauth_token')}=${percentEncode(accessTokenTwitter)}`;
  string += `&${percentEncode('oauth_version')}=${percentEncode('1.0')}`;
  string += `&${percentEncode('tweet_id')}=${percentEncode(tweetId)}`;
  let signatureString = `POST&${percentEncode(url)}&${percentEncode(string)}`;
  let signingKey = `${percentEncode(process.env['TWITTER_API_SECRET_KEY'])}&`;
  let signature = Buffer.from(signHmacSha512(signingKey, signatureString)).toString('base64');*/

        //'Authorization': `OAuth oauth_consumer_key="${percentEncode(oAuthOptions.api_key)}", oauth_nonce="${percentEncode(nonce)}", oauth_signature="${percentEncode(signature)}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${Math.floor(Date.now()/1000)}", oauth_token="${percentEncode(accessTokenTwitter)}", oauth_version="1.0"`,
