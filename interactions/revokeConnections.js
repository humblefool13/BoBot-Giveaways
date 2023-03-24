const twitter_db = require('../models/twitter');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const CryptoJS = require('crypto-js');

function encrypt(message) {
  const cipherCode = CryptoJS.AES.encrypt(message, process.env['secretPhrase']);
  return cipherCode.toString();
}
function decrypt(encryptedString) {
  const cipherText = CryptoJS.AES.decrypt(
    encryptedString,
    process.env['secretPhrase']
  );
  const plainText = cipherText.toString(CryptoJS.enc.Utf8);
  return plainText;
}
async function refreshDiscord(refreshToken) {
  const data = new URLSearchParams({
    client_id: '1001909973938348042',
    client_secret: process.env['client_discord_secret'],
    grant_type: 'refresh_token',
    code: refreshToken,
  });
  const responseDiscord = await fetch(`https://discord.com/api/oauth2/token`, {
    method: 'POST',
    body: data.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const resultDiscord = await responseDiscord.json();
  return resultDiscord;
}
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder().setColor('#35FF6E').setDescription(des);
  return embed;
}

module.exports = {
  name: 'revokeConnections',
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const socialData = await twitter_db.findOne({
        discord_id: interaction.user.id,
      });
      if (!socialData) {
        return interaction.editReply(
          'You have not authorized the application yet.'
        );
      }
      const discordRefreshToken = decrypt(socialData.refresh_token_discord);
      const newDiscordCreds = await refreshDiscord(discordRefreshToken);
      const data = new URLSearchParams({
        client_id: '1001909973938348042',
        client_secret: process.env['client_discord_secret'],
        token: newDiscordCreds.access_token,
      });
      const discordResponse = await fetch(
        'https://discord.com/api/oauth2/token/revoke',
        {
          method: 'POST',
          body: data.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      const discordStatusCode = discordResponse.status;
      if (discordStatusCode == 200) {
        await twitter_db.deleteOne({
          discord_id: interaction.user.id,
        });
        return interaction.editReply('The revoke was successful!');
      } else {
        return interaction.editReply(
          'Something went wrong. We are fixing it, please try again later.'
        );
      }
    } catch (e) {
      console.log(e);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content:
            'I am facing some trouble, the dev has been informed. Please try again in some hours.',
          embeds: [],
          components: [],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            'I am facing some trouble, the dev has been informed. Please try again in some hours.',
          embeds: [],
          components: [],
          ephemeral: true,
        });
      }
      client.users.cache
        .get('727498137232736306')
        .send(
          `${client.user.username} has trouble in revokeConnections.js -\n\n${e}`
        );
    }
  },
};
