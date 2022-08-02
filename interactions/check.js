const wallets = require("../models/wallets.js");
const subs = require("../models/subscriptions.js");

module.exports = {
  name: "check",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const sub = subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub) return interaction.editReply("The subscription for this server has expired, please renew at the [BoBot Labs Support Server](https://discord.gg/HweZtrzAnX) to continue using the services.");
      const find = await wallets.findOne({
        discord_id: interaction.user.id,
        server_id: interaction.guildId,
      });
      if (!find) {
        return interaction.editReply({
          content: "Looks like you have not set-up a wallet address yet. Please do so by clicking the button beside.",
          ephemeral: true,
        });
      } else {
        const wallet = find.wallet.trim();
        return interaction.editReply({
          content: `The wallet address :\n**${wallet}**\n[Opensea](<https://opensea.io/${wallet}> 'Click to open opensea page for this wallet address.')\n[Etherscan](<https://etherscan.io/address/${wallet}> 'Click to open etherscan page for this wallet address.')\nis set up by you for this server and will be automatically submitted when you win a raffle in this server!`,
          ephemeral: true,
          embeds: [],
        });
      };
    } catch (e) {
      console.log(e);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "I am facing some issues , the dev has been informed . Please try again in some hours.",
          embeds: [],
          components: [],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "I am facing some issues , the dev has been informed . Please try again in some hours.",
          embeds: [],
          components: [],
          ephemeral: true,
        });
      };
      client.users.cache.get("727498137232736306").send(`Bobot has trouble in add.js -\n\n${e}`);
    };
  }
}