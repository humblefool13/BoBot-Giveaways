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
      if (!getRole) return interaction.editReply({
        embeds: [MakeEmbedDes("The subscription for this server has expired, please renew at the [BoBot Labs Support Server](https://discord.gg/HweZtrzAnX) to continue using the services.")],
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
        arr.ping = ping;
      };
      if (blacklistedRoles) {
        let roles = 0;
        for (i = 0; i < blacklistedRoles.length; i++) {
          const char = blacklistedRoles.charAt(i);
          const char2 = blacklistedRoles.charAt(i + 1);
          if (char === "@" && char2 === "&") roles++;
        };
        let commas = 0;
        for (i = 0; i < blacklistedRoles.length; i++) {
          const char = blacklistedRoles.charAt(i);
          if (char === ",") commas++;
        };
        if (roles - 1 !== commas) return interaction.editReply(`Please enter the blacklisted roles in correct format.\nexample:\nFor 1 role: \`@role\`\nFor multiple roles: Mention all roles and they **must be separated by commas ","**:\n\`@role1, @role2, @role3 ( ... )\``);
        arr.blacklistedRoles = blacklistedRoles;
      };
      if (bonus) {
        let roles = 0;
        for (i = 0; i < bonus.length; i++) {
          const char = bonus.charAt(i);
          const char2 = bonus.charAt(i + 1);
          if (char === "@" && char2 === "&") roles++;
        };
        let commas = 0;
        for (i = 0; i < bonus.length; i++) {
          const char = bonus.charAt(i);
          if (char === ",") commas++;
        };
        if (roles - 1 !== commas) return interaction.editReply(`Please enter the bonus roles in correct format.\nexample:\nFor 1 role: \`@role 5\`\nFor multiple roles: Mention the roles and state number of entries ( **separated by space** ) and the roles **must be separated by commas ","**:\n\`@role1 5, @role2 6, @role3 7 ( ... )\``);
        arr.bonus = bonus;
      };
      if (balReq) {
        arr.balReq = balReq;
      };
      if (reqRoles) {
        let roles = 0;
        for (i = 0; i < rolesReq.length; i++) {
          const char = rolesReq.charAt(i);
          const char2 = rolesReq.charAt(i + 1);
          if (char === "@" && char2 === "&") roles++;
        };
        let commas = 0;
        for (i = 0; i < rolesReq.length; i++) {
          const char = rolesReq.charAt(i);
          if (char === ",") commas++;
        };
        if (roles - 1 !== commas) return interaction.editReply(`Please enter the role requirements in correct format.\nexample:\nFor 1 role: \`@role\`\nFor multiple roles: Mention all roles and they **must be separated by commas ","**:\n\`@role1, @role2, @role3 ( ... )\``);
        arr.reqRoles = reqRoles;
      };
      if (winnerRole) {
        arr.winnerRole = winnerRole;
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