const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require("discord.js");
const configs = require("../models/configurations.js");
const fs = require("fs");
function makeEmbed(prize, numWinners, end, multipleEntries, requirement, blacklisted, winnerRole) {
  let emoji = "❌";
  if (multipleEntries) emoji = "✅";
  let str = `:white_small_square: Prize : ${prize.trim()}\n:white_small_square: Number of Winners : ${numWinners}\n:white_small_square: Ending On: <t:${parseInt(end / 1000)}:f> ( <t:${parseInt(end / 1000)}:R> )\n:white_small_square: Multiple Entries Enabled: ${emoji}\n`;
  if (requirement) str = str + `:white_small_square: Required Role : <@&${requirement}>\n`;
  if (blacklisted) str = str + `:white_small_square: Blacklisted Role : <@&${blacklisted}>\n`;
  if (winnerRole) str = str + `:white_small_square: Role Awarded to Winners: <@&${winnerRole}>\n`;
  str = str + `\nClick the button below to enter the giveaway.`;
  const embed = new EmbedBuilder()
    .setTitle("Active Giveaway")
    .setDescription(str)
    .setColor("#66ff00")
    .setFooter({ text: "Powered by BoBot Labs" });
  return embed;
};
const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Enter")
      .setEmoji("990317457187172382")
      .setCustomId("enter")
      .setStyle(ButtonStyle.Success)
  );

module.exports = {
  name: "giveaway",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const getRole = await configs.findOne({
        server_id: interaction.guildId,
      });
      const managerRole = getRole.role;
      if (!interaction.member.roles.cache.has(managerRole)) return interaction.editReply({
        content: `Only <@&${managerRole}> can use this command.`
      });
      const prize = interaction.options.getString("prize");
      const postChannel = interaction.options.getChannel('channel');
      const numWinners = interaction.options.getInteger('winners');
      const hours = interaction.options.getInteger('hours');
      const multipleEntries = interaction.options.getBoolean('multiple_entries');
      const requirement = interaction.options.getRole('requirement');
      const blacklisted = interaction.options.getRole('blacklist');
      const winnerRole = interaction.options.getRole('role_add');
      const endTimestamp = interaction.createdTimestamp + hours * 60 * 60 * 1000;
      const permissions = postChannel.permissionsFor(client.user.id);
      if (!permissions.has(PermissionsBitField.Flags.ViewChannel)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.SendMessages)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.ReadMessageHistory)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      const embed = makeEmbed(prize, numWinners, endTimestamp, multipleEntries, requirement?.id, blacklisted?.id, winnerRole?.id);
      const sent = await postChannel.send({
        embeds: [embed],
        components: [row]
      });
      const filename = "/" + [interaction.guildId, postChannel.id, sent.id].join("_") + ".txt";
      const data = [prize, numWinners, endTimestamp, multipleEntries, (requirement ? requirement.id : "NA"), (blacklisted ? blacklisted.id : "NA"), (winnerRole ? winnerRole.id : "NA"), sent.url].join("\n");
      fs.writeFileSync("./giveaways/giveawayConfigs" + filename, data);
      fs.writeFileSync("./giveaways/giveawayEntries" + filename, "");
      return interaction.editReply({
        content: `✅" Successfully created the giveaway - ${sent.url}`
      });
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
};