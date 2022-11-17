const configs = require("../models/configurations.js");
const subs = require("../models/subscriptions.js");
const defaults = require("../models/defaults.js");

module.exports = {
  name: "default-settings",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      let arr = [];
      const sub = subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub) return interaction.editReply({
        embeds: [MakeEmbedDes("The subscription for this server has expired, please renew at the [BoBot Labs Support Server](https://discord.gg/HweZtrzAnX) to continue using the services.")],
      });
      const getRole = await configs.findOne({
        server_id: interaction.guildId,
      });
      const managerRole = getRole.role;
      if (!interaction.member.roles.cache.has(managerRole)) return interaction.editReply({
        content: `Only <@&${managerRole}> can use this command.`
      });
      let ping = interaction.options.getString("ping-role");
      let blacklistedRoles = interaction.options.getString("blacklist-roles");
      let bonus = interaction.options.getString("bonus-entries");
      let balReq = interaction.options.getNumber("minimum-balance");
      let reqRoles = interaction.options.getString("req-roles");
      let winnerRole = interaction.options.getRole("winner-role-add");
      if (!ping && !blacklistedRoles && !bonus && !balReq && !reqRoles && !winnerRole) return interaction.editReply({
        embeds: [MakeEmbedDes("Please fill atleast one option to add to default settings of this server.")]
      });
      if (ping) {
        arr.push({
          name: "ping",
          value: ping,
        });
      };
      if (blacklistedRoles) {
        arr, push({
          name: "blacklistedRoles",
          value: blacklistedRoles,
        });
      };
      if (bonus) {
        arr, push({
          name: "bonus",
          value: bonus,
        });
      };
      if (balReq) {
        arr, push({
          name: "balReq",
          value: balReq,
        });
      };
      if (reqRoles) {
        arr, push({
          name: "reqRoles",
          value: reqRoles,
        });
      };
      if (winnerRole) {
        arr, push({
          name: "winnerRole",
          value: winnerRole,
        });
      };
      const find = await defaults.findOne({
        server_id: interaction.guildId,
      });
      if (find) {
        await defaults.deleteMany({
          server_id: interaction.guildId,
        });
      };
      await new defaults({
        server_id: interaction.guildId,
        defaults: arr,
      }).then(() => {
        return interaction.editReply({
          embeds: [MakeEmbedDes("Your defualt settings are successfully saved and will be applied to all giveaways unless you use the option in the giveaway creation command.")]
        });
      }).catch((e) => {
        console.log(e);
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
      client.users.cache.get("727498137232736306").send(`${client.user.username} has trouble in defaults.js -\n\n${e}`);
    };
  }
}