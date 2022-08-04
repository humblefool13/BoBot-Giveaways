const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require("discord.js");
const configs = require("../models/configurations.js");
const fs = require("fs");
function makeEmbed(prize, numWinners, end, multipleEntries, requirement, blacklisted, winnerRole, walletReq) {
  let emoji = "No";
  if (multipleEntries) emoji = "Yes";
  let emoji2 = "No";
  if (walletReq) emoji2 = "Yes";
  let str = `◆ :trophy: Prize : ${prize.trim()}\n\n◆ :crown: Number of Winners : ${numWinners}\n\n◆ :stopwatch: Ending On: <t:${parseInt(end / 1000)}:f> ( <t:${parseInt(end / 1000)}:R> )\n\n◆ :busts_in_silhouette: Multiple Entries Enabled: ${emoji}\n\n◆ <:ethereum:997764237025890318> Wallet Required: ${emoji2}\n\n`;
  if (requirement) str = str + `◆ :lock: Required Role : <@&${requirement}>\n\n`;
  if (blacklisted) str = str + `◆ :x: Blacklisted Role : <@&${blacklisted}>\n\n`;
  if (winnerRole) str = str + `◆ :military_medal: Role Awarded to Winners: <@&${winnerRole}>\n\n`;
  str = str + `Click the button below to enter the giveaway! :tada:`;
  const embed = new EmbedBuilder()
    .setTitle("Active Giveaway")
    .setDescription(str)
    .setColor("#66ff00")
    .setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://imgur.com/yie1WVK" });
  return embed;
};
const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Enter")
      .setEmoji("1004086533910974605")
      .setCustomId("enter")
      .setStyle(ButtonStyle.Primary)
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
      const walletReq = interaction.options.getBoolean('req-wallet');
      const requirement = interaction.options.getRole('req-role');
      const blacklisted = interaction.options.getRole('blacklist');
      const winnerRole = interaction.options.getRole('winner-role-add');
      const endTimestamp = interaction.createdTimestamp + hours * 60 * 60 * 1000;
      const permissions = postChannel.permissionsFor(client.user.id);
      if (!permissions.has(PermissionsBitField.Flags.ViewChannel)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.SendMessages)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.ReadMessageHistory)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      const embed = makeEmbed(prize, numWinners, endTimestamp, multipleEntries, requirement?.id, blacklisted?.id, winnerRole?.id, walletReq);
      const sent = await postChannel.send({
        embeds: [embed],
        components: [row]
      });
      const filename = "/" + [interaction.guildId, postChannel.id, sent.id].join("_") + ".txt";
      const data = [prize, numWinners, endTimestamp, multipleEntries, (requirement ? requirement.id : "NA"), (blacklisted ? blacklisted.id : "NA"), (winnerRole ? winnerRole.id : "NA"), sent.url, (walletReq ? "Yes" : "No")].join("\n");
      fs.writeFileSync("./giveaways/giveawayConfigs" + filename, data);
      fs.writeFileSync("./giveaways/giveawayEntries" + filename, "");
      const messageLinkRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel("Jump to Giveaway")
            .setStyle(ButtonStyle.Link)
            .setURL(sent.url)
        );
      return interaction.editReply({
        content: `✅ Successfully created the giveaway`,
        components: [messageLinkRow]
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
      client.users.cache.get("727498137232736306").send(`${client.user.username} has trouble in giveaway.js -\n\n${e}`);
    };
  }
}