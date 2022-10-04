const wallets = require("../models/wallets.js");
const subs = require("../models/subscriptions.js");
const twitter = require("../models/twitter.js");
const { EmbedBuilder } = require("discord.js");
function MakeEmbed(des) {
  const embed = new EmbedBuilder()
    .setColor("#35FF6E")
    .setDescription(des)
    .setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" });
  return embed;
};

module.exports = {
  name: "check",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemral: true });
      const sub = await subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub) return interaction.editReply({
        embeds: [MakeEmbed("The subscription for this server has expired, please renew at the [BoBot Labs Support Server](https://discord.gg/HweZtrzAnX) to continue using the services.")],
      });
      const find = await wallets.findOne({
        discord_id: interaction.user.id,
      });
      if (!find) {
        interaction.editReply("You have not saved a wallet address yet.\n\nDo so by clicking the button beside.")
      } else {
        let wallet = "Same as Global Wallet.";
        const global = find.wallet_global;
        const savedWallets = find.wallets;
        savedWallets.forEach((wallets) => {
          if (wallets[0] !== interaction.guild.id) return;
          wallet = wallets[1];
        });
        if (global === "Not Submitted Yet.") {
          if (wallet !== "Same as Global Wallet.") {
            interaction.editReply(`The following wallets are saved by you\n\nin this server:\n**${wallet}**\n\nGlobal wallet:\n**${global}**`);
          } else {
            interaction.editReply(`The following wallets are saved by you\n\nin this server:\n**Not Submitted Yet.**\n\nGlobal wallet:\n**${global}**`);
          };
        } else {
          interaction.editReply(`The following wallets are saved by you\n\nin this server:\n**${wallet}**\n\nGlobal wallet:\n**${global}**`);
        };
      };
      const twitterFind = await twitter.findOne({
        discord_id: interaction.user.id,
      });
      if (!twitterFind) {
        return interaction.followUp({
          embeds: [MakeEmbed(`You have not verified your twitter account. Please do so by clicking the button beside to be able to enter twitter actions gated giveaways.`)],
        });
      } else {
        const twitterUsername = twitterFind.t_username;
        return interaction.followUp({
          embeds: [MakeEmbed(`You have verified your twitter account-\n\n**${twitterUsername}**\n\nIf you ever need to change it, you can hit the verify twitter button again and associate your new account to your discord account.`)],
        });
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
      client.users.cache.get("727498137232736306").send(`${client.user.username} has trouble in check.js -\n\n${e}`);
    };
  }
}