const fs = require("fs");
const settings = require("../models/configurations.js");
const wallets = require("../models/wallets.js");
const { EmbedBuilder } = require("discord.js");
function makeEmbed(messageEmbed, entries) {
  const embed = new EmbedBuilder()
    .setTitle(messageEmbed.title)
    .setDescription(messageEmbed.description)
    .setColor(messageEmbed.hexColor)
    .setFooter({ text: `Powered by bobotlabs.xyz | ${entries} Entries`, iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" });
  return embed;
};
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder()
    .setColor("#35FF6E")
    .setDescription(des)
    .setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" });
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
        if (entries.includes(interaction.member.id)) return interaction.editReply({ embeds: [MakeEmbedDes("You have already entered this giveaway.")] });
      } else {
        entries = [];
      };
      const configs = giveawayConfig.split("\n");
      const multipleEntries = configs[3];
      const roleConfigs = [configs[4], configs[5]];
      const walletReq = configs[8];
      if (walletReq === "Yes") {
        const wallet = await wallets.findOne({
          discord_id: interaction.user.id,
          server_id: interaction.guildId,
        });
        if (!wallet) return interaction.editReply({ embeds: [MakeEmbedDes("You need to save a wallet address before entering this giveaway.")] });
      };
      const roles = interaction.member.roles.cache;
      if (roleConfigs[0] !== "NA" && !roles.has(roleConfigs[0])) return interaction.editReply({ embeds: [MakeEmbedDes(`You do not have the required role to enter this giveaway - <@&${roleConfigs[0]}>.`)] });
      if (roleConfigs[1] !== "NA" && roles.has(roleConfigs[1])) return interaction.editReply({ embeds: [MakeEmbedDes(`You are blacklisted from entering the giveaway since you have the blacklisted role - <@&${roleConfigs[1]}>.`)] });
      let userEntries = 1;
      const server_data = await settings.findOne({
        server_id: interaction.guildId,
      });
      let roleApplicable = ``;
      if (multipleEntries.toLowerCase().trim() === "true") {
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
      } else {
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
        replyContent = `You have successfully entered this giveaway!\nYou have a total of ${userEntries} entry/entries:\n${roleApplicable}\nGoodluck! :slight_smile:`;
      } else {
        replyContent = `You have successfully entered this giveaway!\nYou have a total of ${userEntries} entry/entries!\nGoodluck! :slight_smile:`;
      };
      return interaction.editReply({
        embeds: [MakeEmbedDes(replyContent)],
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
      client.users.cache.get("727498137232736306").send(`${client.user.username} has trouble in enter.js -\n\n${e}`);
    };
  }
}