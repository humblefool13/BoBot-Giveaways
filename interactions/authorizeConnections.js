const subs = require('../models/subscriptions');
const twitter_db = require('../models/twitter');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const rowFirst = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Start')
    .setEmoji('✅')
    .setURL(
      'https://discord.com/api/oauth2/authorize?client_id=1001909973938348042&redirect_uri=http%3A%2F%2F37.59.71.137%3A3000%2Fdiscord&response_type=code&scope=identify%20guilds%20guilds.join'
    )
    .setStyle(ButtonStyle.Link)
);
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder().setColor('#35FF6E').setDescription(des);
  return embed;
}

module.exports = {
  name: 'authorizeConnections',
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const sub = await subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub)
        return interaction.editReply({
          embeds: [
            MakeEmbedDes(
              'SnapBot subscription for this server has expired, please contact ST6 to continue using our services.'
            ),
          ],
        });
      const find = await twitter_db.findOne({
        discord_id: interaction.user.id,
      });
      let sent;
      if (find) {
        sent = await interaction.editReply({
          content:
            'You have already connected your Discord & Twitter accounts.\nIf you want to change your accounts, please click the "Start" button below to connect new account(s).',
          components: [rowFirst],
          fetchReply: true,
        });
      } else {
        sent = await interaction.editReply({
          content:
            'Please click the "Start" button below to connect your Discord & Twitter accounts! This is a one-time process!',
          components: [rowFirst],
          fetchReply: true,
        });
      }
    } catch (e) {
      console.log(e);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content:
            'I am having some trouble, the developer has been informed. Please try again in a few hours.',
          embeds: [],
          components: [],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            'I am having some trouble, the developer has been informed. Please try again in a few hours.',
          embeds: [],
          components: [],
          ephemeral: true,
        });
      }
      client.users.cache
        .get('727498137232736306')
        .send(`${client.user.username} has trouble in twitter.js -\n\n${e}`);
    }
  },
};
