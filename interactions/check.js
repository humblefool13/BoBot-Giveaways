const wallets = require("../models/wallets.js");
const subs = require("../models/subscriptions.js");
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
      await interaction.deferReply({ ephemeral: true });
      const sub = subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub) return interaction.editReply({
        embeds: [MakeEmbed("The subscription for this server has expired, please renew at the [BoBot Labs Support Server](https://discord.gg/HweZtrzAnX) to continue using the services.")],
      });
      const find = await wallets.findOne({
        discord_id: interaction.user.id,
        server_id: interaction.guildId,
      });
      if (!find) {
        return interaction.editReply({
          embeds: [MakeEmbed("Looks like you have not set-up a wallet address yet. Please do so by clicking the button beside.")],
        });
      } else {
        const wallet = find.wallet.trim();
        return interaction.editReply({
          embeds: [MakeEmbed(`The wallet address :\n**${wallet}**\nis set up by you for this server and will be automatically submitted when you win a raffle in this server!`)],
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