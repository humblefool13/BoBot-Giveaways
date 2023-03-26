const wallets = require('../models/wallets.js');
const subs = require('../models/subscriptions.js');
const twitter = require('../models/twitter.js');
const { EmbedBuilder } = require('discord.js');
function MakeEmbed(des) {
  const embed = new EmbedBuilder().setColor('#35FF6E').setDescription(des);
  return embed;
}

module.exports = {
  name: 'check',
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const sub = await subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub)
        return interaction.editReply({
          ephemeral: true,
          embeds: [
            MakeEmbed(
              'SnapBot subscription for this server has expired, please contact ST6 to continue using our services.'
            ),
          ],
        });
      const socialsData = await twitter.findOne({
        discord_id: interaction.user.id,
      });
      const walletsData = await wallets.findOne({
        discord_id: interaction.user.id,
      });
      let description = '';
      if (socialsData) {
        description += `You have connected your socials to the bot.\nConnected Discord Account: **[${socialsData.discord_username}](https://discordapp.com/users/${socialsData.discord_id})**\nConnected Twitter Account: **[${socialsData.twitter_username}](https://twitter.com/${socialsData.twitter_username})**`;
        if (walletsData) {
          description += `\n\nThe wallet configuration is shown below:\n`;
          if (walletsData.wallet_global_eth) {
            description += `Global Ethereum Wallet Address:\n**${walletsData.wallet_global_eth}**\n\n`;
          }
          if (walletsData.wallet_global_sol) {
            description += `Global Solana Wallet Address:\n**${walletsData.wallet_global_sol}**\n\n`;
          }
          if (walletsData.wallet_global_apt) {
            description += `Global Aptos Wallet Address:\n**${walletsData.wallet_global_apt}**\n\n`;
          }
          if (walletsData.wallet_global_mulx) {
            description += `Global MultiversX Wallet Address:\n**${walletsData.wallet_global_mulx}**\n\n`;
          }
          if (walletsData.wallets_eth) {
            const wallets = walletsData.wallets_eth;
            const find = wallets.find((el) => el[0] === interaction.guildId);
            if (find) {
              description += `Server Ethereum Wallet:\n**${find[1]}**\n\n`;
            }
          }
          if (walletsData.wallets_sol) {
            const wallets = walletsData.wallets_sol;
            const find = wallets.find((el) => el[0] === interaction.guildId);
            if (find) {
              description += `Server Solana Wallet:\n**${find[1]}**\n\n`;
            }
          }
          if (walletsData.wallets_apt) {
            const wallets = walletsData.wallets_apt;
            const find = wallets.find((el) => el[0] === interaction.guildId);
            if (find) {
              description += `Server Aptos Wallet:\n**${find[1]}**\n\n`;
            }
          }
          if (walletsData.wallets_mulx) {
            const wallets = walletsData.wallets_mulx;
            const find = wallets.find((el) => el[0] === interaction.guildId);
            if (find) {
              description += `Server MultiversX Wallet:\n**${find[1]}**`;
            }
          }
        } else {
          description += `\n\nNo Data saved on your wallets.`;
        }
      } else {
        if (walletsData) {
          description += `No data saved on your social connections.\n\n`;
          description += `The wallet configuration is shown below:\n`;
          if (walletsData.wallet_global_eth) {
            description += `Global Ethereum Wallet Address:\n**${walletsData.wallet_global_eth}**\n\n`;
          }
          if (walletsData.wallet_global_sol) {
            description += `Global Solana Wallet Address:\n**${walletsData.wallet_global_sol}**\n\n`;
          }
          if (walletsData.wallet_global_apt) {
            description += `Global Aptos Wallet Address:\n**${walletsData.wallet_global_apt}**\n\n`;
          }
          if (walletsData.wallet_global_mulx) {
            description += `Global MultiversX Wallet Address:\n**${walletsData.wallet_global_mulx}**\n\n`;
          }
          if (walletsData.wallets_eth) {
            const wallets = walletsData.wallets_eth;
            const find = wallets.find((el) => el[0] === interaction.guildId);
            if (find) {
              description += `Server Ethereum Wallet:\n**${find[1]}**\n\n`;
            }
          }
          if (walletsData.wallets_sol) {
            const wallets = walletsData.wallets_sol;
            const find = wallets.find((el) => el[0] === interaction.guildId);
            if (find) {
              description += `Server Solana Wallet:\n**${find[1]}**\n\n`;
            }
          }
          if (walletsData.wallets_apt) {
            const wallets = walletsData.wallets_apt;
            const find = wallets.find((el) => el[0] === interaction.guildId);
            if (find) {
              description += `Server Aptos Wallet:\n**${find[1]}**\n\n`;
            }
          }
          if (walletsData.wallets_mulx) {
            const wallets = walletsData.wallets_mulx;
            const find = wallets.find((el) => el[0] === interaction.guildId);
            if (find) {
              description += `Server MultiversX Wallet:\n**${find[1]}**`;
            }
          }
        } else {
          description +=
            'No data available.\nTry this after authorizing the bot or saving your wallets.';
        }
      }
      interaction.editReply({
        ephemeral: true,
        embeds: [MakeEmbed(description)],
      });
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
        .send(`${client.user.username} has trouble in check.js -\n\n${e}`);
    }
  },
};
