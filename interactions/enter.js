const fs = require("fs");
const settings = require("../models/configurations.js");
const { EmbedBuilder } = require("discord.js");
function makeEmbed(messageEmbed, entries) {
  const embed = new EmbedBuilder()
    .setTitle(messageEmbed.title)
    .setDescription(messageEmbed.description)
    .setColor(messageEmbed.hexColor)
    .setFooter(`Powered by BoBot Labs | ${entries} Entries`);
  return embed;
};

module.exports = {
  name: "enter",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const giveawaysConfigsDir = fs.readdirSync("./giveaways/giveawayConfigs");
      const giveawaysEntriesDir = fs.readdirSync("./giveaways/giveawayEntries");
      const giveawayConfigsFile = giveawaysConfigsDir.find((file) => file.includes(interaction.guildId) && file.includes(interaction.channelId) && file.includes(interaction.message.id));
      const giveawayEntriesFile = giveawaysEntriesDir.find((file) => file.includes(interaction.guildId) && file.includes(interaction.channelId) && file.includes(interaction.message.id));
      if (!giveawayEntriesFile || !giveawayConfigsFile) return interaction.editReply("invalid/unknown giveaway");
      const giveawayConfig = fs.readFileSync(`./giveaways/giveawayConfigs/${giveawayConfigsFile}`, { encoding: 'utf8', flag: 'r' });
      const giveawayEntries = fs.readFileSync(`./giveaways/giveawayEntries/${giveawayEntriesFile}`, { encoding: 'utf8', flag: 'r' });
      let entries = [];
      if (giveawayEntries.length) {
        entries = giveawayEntries.split("\n");
        if (entries.includes(interaction.member.id)) return interaction.editReply("You have already entered this giveaway.");
      } else {
        entries = [];
      };
      const configs = giveawayConfig.split("\n");
      const roleConfigs = [configs[4], configs[5]];
      const roles = interaction.member.roles.cache;
      if (roleConfigs[0] !== "NA" && !roles.has(roleConfigs[0])) return interaction.editReply(`You do not have the required role to enter this giveaway - <@&${roleConfigs[0]}>.`);
      if (roleConfigs[1] !== "NA" && roles.has(roleConfigs[1])) return interaction.editReply(`You are blacklisted from entering the giveaway since you have the blacklisted role - <@&${roleConfigs[1]}>.`);
      let userEntries = 1;
      const server_data = await settings.findOne({
        server_id: interaction.guildId,
      });
      let roleApplicable = ``;
      const roleEntries = server_data.roles;
      roleEntries.forEach((roleArray) => {
        const role = roleArray[0];
        const entry = roleArray[1];
        if (roles.has(role)) {
          userEntries += entry;
          roleApplicable += `<@&${role}> = ${entry} entries\n`;
        };
      });
      for (i = 1; i <= userEntries; i++) {
        entries.push(interaction.member.id);
      };
      let entriesString = entries.join("\n");
      fs.writeFileSync(`./giveaways/giveawayEntries/${giveawayEntriesFile}`, entriesString);
      const totalEntriesNew = entries.length;
      const locationString = giveawayConfigsFile.slice(0, giveawayConfigsFile.length - 4);
      const location = locationString.split("_");
      const channel = await client.guilds.cache.get(location[0]).channels.fetch(location[1]);
      const message = await channel.messages.fetch(location[2]);
      const embed = makeEmbed(message.embeds[0], totalEntriesNew);
      await message.edit({
        embeds: [embed],
        components: message.components,
      });
      let replyContent;
      if (roleApplicable) {
        replyContent = `You have successfully entered this giveaway!\nYou have a total of ${userEntries} entry/entries:\nCommon Entry = 1\n${roleApplicable}\nGoodluck! :slight_smile:`;
      } else {
        replyContent = `You have successfully entered this giveaway!\nYou have a total of ${userEntries} entry/entries:\nCommon Entry = 1\n\nGoodluck! :slight_smile:`;
      };
      return interaction.editReply({
        content: replyContent,
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