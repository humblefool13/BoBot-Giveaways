const configs = require("../models/configurations.js");
const { EmbedBuilder } = require("discord.js");
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder()
    .setColor("#35FF6E")
    .setDescription(des)
    .setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://imgur.com/yie1WVK" });
  return embed;
};

module.exports = {
  name: "entries",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const subCommand = interaction.options.getSubcommand();
      const config = await configs.findOne({
        server_id: interaction.guildId,
      });
      if (!config) return interaction.editReply({ embeds: [MakeEmbedDes("Please use `/setup` to start using the bot in this server.")] });
      let roles = config.roles;
      if (subCommand !== "view" && !interaction.member.roles.cache.has(config.role)) return interaction.editReply({
        embeds: [MakeEmbedDes(`Only <@&${config.role}> can use this command.`)]
      });
      if (subCommand === "view") {
        let rolesString = "", i = 1;
        if (roles[0].length) {
          roles.forEach((roleArray) => {
            rolesString += `\n${i++}) <@&${roleArray[0]}> = **${roleArray[1]}** entries`;
          });
        };
        if (!rolesString.length) return interaction.editReply({ embeds: [MakeEmbedDes("No role has been set for multiple entries in this server yet.")] });
        return interaction.editReply({ embeds: [MakeEmbedDes(`The following role and entries configuration is saved in this server:\n${rolesString}`)] });
      } else if (subCommand === "remove") {
        const role = interaction.options.getRole("role");
        const roleId = role.id;
        let arr=[];
        roles.forEach((roleArray) => {
          if (roleArray[0] === roleId) return;
          arr.push(roleArray);
        });
        if (arr.length === roles.length) return interaction.editReply({ embeds: [MakeEmbedDes("No configuration is saved for this role. Please check the saved configurations using `/entries view` command.")] });
        config.roles = arr;
        await config.save().catch((e) => { });
        return interaction.editReply({ embeds: [MakeEmbedDes(`The entries for role - <@&${roleId}> has been removed.`)] });
      } else if (subCommand === "set") {
        const role = interaction.options.getRole("role");
        const roleId = role.id;
        const newEntries = interaction.options.getInteger("entries");
        let newRoles = roles, found = false;
        roles.forEach((roleArray) => {
          if (roleArray[0] === roleId) found = true;
        });
        if (found) return interaction.editReply({ embeds: [MakeEmbedDes("A configuration already exists for this role, please use `/entries edit` command.")] });
        if (newRoles[0].length) {
          newRoles.push([roleId, newEntries])
        } else {
          newRoles = [[roleId, newEntries]];
        };
        config.roles = newRoles;
        await config.save().catch((e) => { });
        return interaction.editReply({ embeds: [MakeEmbedDes(`New configuration saved:\n<@&${roleId}> = ${newEntries} Entries.`)] });
      } else if (subCommand === "edit") {
        const role = interaction.options.getRole("role");
        const roleId = role.id;
        const newEntries = interaction.options.getInteger("entries");
        let found = false, newroles = [];
        roles.forEach((roleArray) => {
          if (roleArray[0] === roleId) found = true;
          if (roleArray[0] !== roleId) newroles.push(roleArray);
        });
        if (!found) return interaction.editReply({ embeds: [MakeEmbedDes("No configuration is saved for this role, please use `/entries set` command.")] });
        newroles.push([roleId, newEntries]);
        config.roles = newroles;
        await config.save().catch((e) => { });
        return interaction.editReply({ embeds: [MakeEmbedDes(`Configuration editted to:\n<@&${roleId}> = ${newEntries} Entries.`)] });
      } else return;
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
      client.users.cache.get("727498137232736306").send(`${client.user.username} has trouble in entries.js -\n\n${e}`);
    };
  }
}