const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require("discord.js");
const configs = require("../models/configurations.js");
const { writeFileSync } = require("fs");
function makeEmbed(prize, winners, endTimestamp, walletReq, reqRoles, blacklistRoles, entries, winnerRoles) {
  let descriptionString = "";
  descriptionString = descriptionString + `◆ :trophy: **Prize Name** : \`${prize}\`\n\n`;
  descriptionString = descriptionString + `◆ :crown: **Number of Winners** : ${winners}\n\n`;
  descriptionString = descriptionString + `◆ :stopwatch: **Ending On** : <t:${parseInt(endTimestamp / 1000)}:f> ( <t:${parseInt(endTimestamp / 1000)}:R> )\n\n`;
  descriptionString = descriptionString + `◆ <:ethereum:997764237025890318> **Wallet Required** : ${walletReq}\n\n`;
  if (winnerRoles !== "NA") descriptionString = descriptionString + `◆ :military_medal: **Role Awarded to Winners** : <@&${winnerRoles}>\n\n`;
  if (reqRoles !== "NA") descriptionString = descriptionString + `◆ :lock: **Must have any of following roles to enter** :\n<@&${reqRoles.join(">, <@&")}>\n\n`;
  if (blacklistRoles !== "NA") descriptionString = descriptionString + `◆ :x: **Must *not* have any of following roles to enter** :\n<@&${blacklistRoles.join(">, <@&")}>\n\n`;
  if (entries !== "NA") {
    descriptionString = descriptionString + "◆ :busts_in_silhouette: **Roles with Multiple Entries** :\n";
    entries.forEach((roleArray) => {
      descriptionString = descriptionString + `<@&${roleArray[0]}> - ${roleArray[1]} Entries\n`;
    });
    descriptionString = descriptionString + "\n";
  };
  descriptionString = descriptionString + "Click the button below to enter the giveaway! :tada:";
  const embed = new EmbedBuilder()
    .setTitle("Active Giveaway")
    .setDescription(descriptionString)
    .setColor("#66ff00")
    .setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" });
  return embed;
};
function findTimestamp(durationString) {
  const split = durationString.split(" ");
  let timestamp = Date.now();
  split.forEach((timeString) => {
    const TimeNumber = Number(timeString.trim().slice(0, timeString.length - 1));
    if (timeString.includes("d")) {
      timestamp += TimeNumber * 24 * 60 * 60 * 1000;
    } else if (timeString.includes("h")) {
      timestamp += TimeNumber * 60 * 60 * 1000;
    } else if (timeString.includes("m")) {
      timestamp += TimeNumber * 60 * 1000;
    };
  });
  return timestamp;
};
function parseRoles(string) {
  let roles = [];
  const split = string.split(",");
  split.forEach((role) => {
    const trim = role.trim();
    const roleId = trim.slice(3, trim.length - 1);
    roles.push(roleId);
  });
  return roles;
};
function getEntries(string) {
  let arr = [];
  const split = string.split(",");
  split.forEach((roleEntry) => {
    let vari = roleEntry.trim();
    if (!vari.includes(" ")) {
      const role = vari.trim().slice(0, vari.indexOf(">") + 1);
      const entry = vari.slice(vari.indexOf(">") + 1);
      vari = [role, entry].join(" ");
    };
    const split2 = vari.replaceAll("  ", " ").split(" ");
    const entry = Number(split2[1]);
    const role = split2[0].trim().slice(3, split2[0].trim().length - 1);
    arr.push([role, entry])
  });
  return arr;
};
const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Enter")
      .setEmoji("1004086533910974605")
      .setCustomId("enter")
      .setStyle(ButtonStyle.Primary)
  );
function stringa(roles) {
  if (typeof roles === "string") {
    return "NA";
  } else {
    const string = roles.join(",");
    return string;
  };
};
function stringaoa(rolesEntry) {
  if (typeof roles === "string") {
    return "NA";
  } else {
    let arr = [];
    rolesEntry.forEach((roleArray) => {
      const string = roleArray.join("-");
      arr.push(string);
    });
    return arr.join(",");
  };
};

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
      const channel = interaction.options.getChannel("channel");
      const winners = interaction.options.getInteger("winners");
      const duration = interaction.options.getString("duration");
      const walletReq = interaction.options.getBoolean("req-wallet");
      const bonus = interaction.options.getString("bonus-entries");
      const rolesReq = interaction.options.getString("req-roles");
      const blacklistedRoles = interaction.options.getString("blacklist-roles");
      const winnerRole = interaction.options.getRole("winner-role-add");

      if (rolesReq) {
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
      };

      let reqRoles = "NA", blacklistRoles = "NA", entries = "NA", winnerRoles = "NA", wallet = "No";
      const endTimestamp = findTimestamp(duration.toLowerCase().trim());
      if (rolesReq) reqRoles = parseRoles(rolesReq);
      if (blacklistedRoles) blacklistRoles = parseRoles(blacklistedRoles);
      if (bonus) entries = getEntries(bonus);
      if (winnerRole) winnerRoles = winnerRole.id;
      if (walletReq) wallet = "Yes";

      const permissions = channel.permissionsFor(client.user.id);
      if (!permissions.has(PermissionsBitField.Flags.ViewChannel)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.SendMessages)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.ReadMessageHistory)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.editReply(`Please give me the following permissions in <#${postChannel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);

      const embed = makeEmbed(prize, winners, endTimestamp, wallet, reqRoles, blacklistRoles, entries, winnerRoles);
      const sent = await postChannel.send({
        embeds: [embed],
        components: [row]
      });
      const filename = "/" + [interaction.guildId, postChannel.id, sent.id].join("_") + ".txt";
      const data = [prize, winners, endTimestamp, winnerRoles, wallet, stringa(reqRoles), stringa(blacklistRoles), stringaoa(entries), sent.url].join("\n");
      writeFileSync("./giveaways/giveawayConfigs" + filename, data);
      writeFileSync("./giveaways/giveawayEntries" + filename, "");
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