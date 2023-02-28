const twitter_db = require("../models/twitter");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');
const CryptoJS = require("crypto-js");

function encrypt(message) {
  const cipherCode = CryptoJS.AES.encrypt(message, process.env['secretPhrase']);
  return cipherCode.toString();
};
function decrypt(encryptedString) {
  const cipherText = CryptoJS.AES.decrypt(encryptedString, process.env['secretPhrase']);
  const plainText = cipherText.toString(CryptoJS.enc.Utf8);
  return plainText;
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

module.exports = {
  name: "revokeConnections",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const socialData = await twitter_db.findOne({
        discord_id: interaction.user.id,
      });
      if (!socialData) {
        return interaction.editReply("You have not authorzied the application yet.")
      };
      const twitterAccessToken = decrypt(socialData.access_token_twitter);
      const discordAccessToken = decrypt(socialData.access_token_discord);
      const twitterResponse = await fetch(`https://api.twitter.com/2/oauth2/revoke?token=${twitterAccessToken}`, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          'Authorization': `Basic ${(process.env["auth_token"]).replaceAll(`"`, "")}`,
        },
        method: "POST"
      });
      const twitterResult = twitterResponse.status;
      const data = new URLSearchParams({
        client_id: '1001909973938348042',
        client_secret: process.env['client_discord_secret'],
        token: discordAccessToken,
      });
      const discordResponse = await fetch('https://discord.com/api/oauth2/token/revoke', {
        method: "POST",
        body: data.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      const discordResult = discordResponse.status;
      if (discordResult == 200 && twitterResult == 200) {
        await twitter_db.deleteOne({
          discord_id: interaction.user.id,
        });
        return interaction.editReply('The revoke was successful!\nThe application no longer has access to your Authorization Credentials.');
      } else {
        const discordRefreshToken = decrypt(socialData.refresh_token_discord);
        const twitterRefreshToken = decrypt(socialData.refresh_token_twitter);
        const newDiscordCreds = await refreshDiscord(discordRefreshToken);
        const newTwitterCreds = await refreshTwitterCreds(twitterRefreshToken);
        const newtwitterResponse = await fetch(`https://api.twitter.com/2/oauth2/revoke?token=${newTwitterCreds.access_token}`, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            'Authorization': `Basic ${(process.env["auth_token"]).replaceAll(`"`, "")}`,
          },
          method: "POST"
        });
        const newTwitterResult = newtwitterResponse.status;
        const newdata = new URLSearchParams({
          client_id: '1001909973938348042',
          client_secret: process.env['client_discord_secret'],
          token: newDiscordCreds.access_token,
        });
        const newdiscordResponse = await fetch('https://discord.com/api/oauth2/token/revoke', {
          method: "POST",
          body: newdata.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        });
        const newDiscordResult = newdiscordResponse.status;
        if (newDiscordResult == 200 && newTwitterResult == 200) {
          await twitter_db.deleteOne({
            discord_id: interaction.user.id,
          });
          return interaction.editReply('The revoke was successful!\nThe application no longer has access to your Authorization Credentials.');
        } else {
          return interaction.editReply('Something went wrong. We are fixing it, please try again later.');
        };
      };
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
      client.users.cache.get("727498137232736306").send(`${client.user.username} has trouble in revokeConnections.js -\n\n${e}`);
    };
  }
};