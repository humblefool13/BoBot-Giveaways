const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, Embed } = require("discord.js");
const configs = require("../models/configurations.js");
const subs = require("../models/subscriptions.js");
const { writeFileSync } = require("fs");
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
function processRole(roles) {
  const roleArray = roles.split(",");
  let outputarr = [];
  roleArray.forEach((role) => {
    let r = role.trim().slice(0, vari.indexOf(">") + 1);
    outputarr.push(r);
  });
  return outputarr.join(",");
};
function processBonus(string) {
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
    arr.push([role, entry].join("-"));
  });
  return arr.join(",");
};
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder()
    .setColor("#35FF6E")
    .setDescription(des)
    .setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" });
  return embed;
};
function processFollow(input) {
  let exportString;
  const accounts = input.split(",");
  accounts.forEach((account) => {
    const username = account.trim().replaceAll("@", "");
    const url = `<https://twitter.com/${username}>`;
    const string = `\n[${username}](${url})`;
    exportString += string;
  });
  return exportString;
};

module.exports = {
  name: "giveaway",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
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

      const prize = interaction.options.getString("prize");
      const channel = interaction.options.getChannel("channel");
      const winners = interaction.options.getInteger("winners");
      const walletReq = interaction.options.getBoolean("req-wallet");
      const time = interaction.options.getString("duration");
      const ping = interaction.options.getString("ping-role");
      const blacklistedRoles = interaction.options.getString("blacklist-roles");
      const bonus = interaction.options.getString("bonus-entries");
      const balReq = interaction.options.getNumber("minimum-balance"); 
      const reqRoles = interaction.options.getString("req-roles");
      const winnerRole = interaction.options.getRole("winner-role-add");
      const picture = interaction.options.getAttachment("attach-picture");

      const followReq = interaction.options.getString("follow-twit-req");
      const likeReq = interaction.options.getString("like-twit-req");
      const rtReq = interaction.options.getString("rt-twit-req");

      const permissions = channel.permissionsFor(client.user.id);
      if (!permissions.has(PermissionsBitField.Flags.ViewChannel)) return interaction.editReply(`Please give me the following permissions in <#${channel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.SendMessages)) return interaction.editReply(`Please give me the following permissions in <#${channel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.ReadMessageHistory)) return interaction.editReply(`Please give me the following permissions in <#${channel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);
      if (!permissions.has(PermissionsBitField.Flags.EmbedLinks)) return interaction.editReply(`Please give me the following permissions in <#${channel.id}>:\n1) View Channel\n2) Send Messages\n3) Read Message History\n4) Embed Links`);

      const endTimestamp = findTimestamp(time.toLowerCase().trim());
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
      if (balReq && !walletReq) return interaction.editReply("Minimum balance requirement is only supported in giveaways with wallet required set to true.");
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
      };
      let followRequirement;
      if (followReq) followRequirement = processFollow(followReq);
      let descriptionString = "";
      descriptionString += `:trophy: **Prize Name** : \`${prize}\`\n\n`;
      descriptionString += `:crown: **Winners** : ${winners}\n\n`;
      descriptionString += `:stopwatch: **Ending** : <t:${parseInt(endTimestamp / 1000)}:f> ( <t:${parseInt(endTimestamp / 1000)}:R> )\n\n`;
      descriptionString += `<:wallet:1030387510372741150> **Wallet Required** : ${walletReq}\n\n`;
      if (balReq) descriptionString += `<:ethereum:997764237025890318> **Minimum Balance Required** : ${balReq} Ξ\n\n`;
      if (winnerRole) descriptionString += `:military_medal: **Role Awarded to Winners** : <@&${winnerRole.id}>\n\n`;
      if (reqRoles) {
        let reqroles = parseRoles(reqRoles);
        reqroles = reqroles.join(">, <@&");
        reqroles = `<@&${reqroles}>`;
        descriptionString += `:lock: **Must have any of these roles** :\n${reqroles}\n\n`;
      };
      if (blacklistedRoles) {
        let blacklist = parseRoles(blacklistedRoles);
        blacklist = blacklist.join(">, <@&");
        blacklist = `<@&${blacklist}>`;
        descriptionString += `:x: **Must __*not*__ have any of these roles** :\n${blacklist}\n\n`;
      };
      if (bonus) {
        let entries = getEntries(bonus);
        descriptionString = descriptionString + ":busts_in_silhouette: **Multiple Entries** :\n";
        entries.forEach((roleArray) => {
          descriptionString = descriptionString + `<@&${roleArray[0]}> +${roleArray[1]} Entries\n`;
        });
        descriptionString = descriptionString + "\n";
      };
      if (followReq) {
        descriptionString += `:: **Must follow these account(s)** : ${followRequirement}\n\n`;
      };
      if (likeReq) {
        descriptionString += `:heart: **Must like this tweet** : \n${likeReq}\n\n`;
      };
      if (rtReq) {
        descriptionString += `:arrows_clockwise: **Must retweet this tweet** : \n${rtReq}\n\n`;
      };
      const embed = new EmbedBuilder()
        .setTitle("Active Giveaway")
        .setDescription(descriptionString)
        .setColor("#35FF6E")
        .setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" });
      if (picture && picture.contentType === "image") {
        embed.setImage(picture.url);
      };
      const postChannel = await client.guilds.cache.get(interaction.guild.id).channels.fetch(channel.id);
      const sent = await postChannel.send({
        content: ping,
        embeds: [embed],
        components: [row]
      });
      const filename = "/" + [interaction.guildId, channel.id, sent.id].join("_") + ".txt";
      const data = [prize, winners, (walletReq) ? "YES" : "NO", endTimestamp, (balReq) ? balReq : "NA", (winnerRole) ? winnerRole.id : "NA", (reqRoles) ? processRole(reqRoles) : "NA", (blacklistedRoles) ? processRole(blacklistedRoles) : "NA", (bonus) ? processBonus(bonus) : "NA", (followReq) ? followReq : "NA", (likeReq) ? likeReq : "NA", (rtReq) ? rtReq : "NA"];
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