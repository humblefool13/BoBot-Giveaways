const subs = require("../models/subscriptions.js");
const configs = require("../models/configurations.js");
const wait = require('node:timers/promises').setTimeout;
const { ChannelType, PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

function makeEmbed(name, guild_icon, guild_id) {
  const embed = new EmbedBuilder()
    .setTitle("Wallet Address Submission")
    .setDescription(`Hello there! :wave:\n\n<a:hexstar:1002639618409250836> ${name} uses BoBot Labs' Giveaway Bot for most advanced giveaways and post giveaways operations.\n<a:hexstar:1002639618409250836> Everytime you win a giveaway, your wallet address is instantly and automatically submitted.\nTo faciliate above please submit your wallet using the \`SUBMIT\` button below!\n\nPlease make sure you enter the wallet address you want to be submitted to projects for the WLs you win **[ :warning: Burner wallet highly recommended :warning: ]**`)
    .setColor("Random");
  if (guild_icon.startsWith("a_")) {
    embed.setThumbnail(`https://cdn.discordapp.com/icons/${guild_id}/${guild_icon}.gif`);
  } else {
    embed.setThumbnail(`https://cdn.discordapp.com/icons/${guild_id}/${guild_icon}.png`);
  };
  return embed;
};
const row = new ActionRowBuilder()
.addComponents(
  new ButtonBuilder()
  .setLabel("SUBMIT")
  .setCustomId("submit")
  .setStyle(ButtonStyle.Success)
  .setEmoji("📝"),
  new ButtonBuilder()
  .setLabel("CHECK")
  .setCustomId("check")
  .setStyle(ButtonStyle.Primary)
  .setEmoji("🔎")
);

module.exports = {
  name: "setup",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator) && !interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild) && interaction.user.id !== interaction.guild?.ownerId) return interaction.editReply({
        content: "This command can only be used by you in a Discord Server where either of the following apply :\n1) You are the Owner of the Discord Server.\n2) You have the **ADMINISTRATOR** permission in the server.\n3) You have the **MANAGE SERVER** permission in the server.",
        ephemeral: true,
      });
      const sub = await subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub) return interaction.editReply("This discord server does not has a valid subscription. Please contact at [BoBot Labs Support Server](https://discord.gg/HweZtrzAnX) to get a subscription/renew an expired subscription.");
      const category = await interaction.guild.channels.create({
        name: "BOBOT GIVEAWAYS",
        type: ChannelType.GuildCategory,
      });
      const setupChannel = await interaction.guild.channels.create({
        name: "✅︱bobot-handler",
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.guildId,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      const outputChannel = await interaction.guild.channels.create({
        name: "✅︱bobot-winners",
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.guildId,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      const role = await interaction.guild.roles.create({
        name: "BoBot Giveaway Manager",
        color: "#00FFFF",
        reason: "The role for BoBot Giveaway Manager.",
      });
      await outputChannel.permissionOverwrites.create(role.id, { ViewChannel: true });
      await outputChannel.permissionOverwrites.create(client.user.id, { ViewChannel: true, SendMessages: true, AttachFiles: true});
      await configs.deleteOne({
        server_id: interaction.guildId,
      });
      await new configs({
        server_id: interaction.guildId,
        roles: [[]],
        expired: false,
        expired_timestamp: 0,
        role: role.id,
        submit_channel: outputChannel.id,
      }).save().catch((e) => {
        console.log(e)
      });
      const embed = makeEmbed(interaction.guild.name, interaction.guild.icon, interaction.guildId);
      await setupChannel.send({
        embeds:[embed],
        components:[row],
      });
      await outputChannel.send(":ledger: Please read the following instructions:");
      await interaction.editReply(":ledger: Please read the following instructions:");
      await wait(2000);
      await outputChannel.send(`1) I have made a role <@&${role.id}> who will be able to use management commands. Giving the role to anyone will allow them to start giveaways and add/edit/remove number of entries for roles. Please head to server settings and put the role on high hierarhcy position for safety. You can rename the role or change color but if the role gets deleted you will have to \`/setup\` again.`);
      await interaction.followUp(`1) I have made a role <@&${role.id}> who will be able to use management commands. Giving the role to anyone will allow them to start giveaways and add/edit/remove number of entries for roles. Please head to server settings and put the role on high hierarhcy position for safety. You can rename the role or change color but if the role gets deleted you will have to \`/setup\` again.`);
      await wait(2000);
      await outputChannel.send(`2) I have made 2 channels :\n:white_small_square: <#${setupChannel.id}>:\nThis channel will be used by people to submit the wallets and view the wallet submitted. Please change the permission of channel and allow the required role to "View Channel".\n\n:white_small_square: <#${outputChannel.id}>:\nThis is the channel you will receive the file with winners' details every time a giveaway ends. Always make sure I have permission to "View Channel" and "Attach Files". Keep this channel private, the giveaway manager role I created can see the channel by default while others cannot.\n\nFeel free to rename the channels or move them to another location/category but if gets deleted you will have to \`/setup\` again.`);
      await interaction.followUp(`2) I have made 2 channels :\n:white_small_square: <#${setupChannel.id}>:\nThis channel will be used by people to submit the wallets and view the wallet submitted. Please change the permission of channel and allow the required role to "View Channel".\n\n:white_small_square: <#${outputChannel.id}>:\nThis is the channel you will receive the file with winners' details every time a giveaway ends. Always make sure I have permission to "View Channel" and "Attach Files". Keep this channel private, the giveaway manager role I created can see the channel by default while others cannot.\n\nFeel free to rename the channels or move them to another location/category but if gets deleted you will have to \`/setup\` again.`);
      await wait(2000);
      await outputChannel.send(`3) The manager role can use \`/entries\` and its subcommands to view/edit/add/remove entries for roles.`);
      await interaction.followUp(`3) The manager role can use \`/entries\` and its subcommands to view/edit/add/remove entries for roles.`);
      await wait(2000);
      await outputChannel.send(`4) Once your subscription ends, I will keep all configurations and wallets saved for 7 days. If you renew within 7 days, eveything will be smooth and keep working fine with old channels/roles/wallets and no data will be lost. But if the subscription is not renewed within 7 days, I will erase all data **permanently**, after which if you decide to use the bot, the users will have to submit wallets again and you will have to \`/setup\` again.`);
      await interaction.followUp(`4) Once your subscription ends, I will keep all configurations and wallets saved for 7 days. If you renew within 7 days, eveything will be smooth and keep working fine with old channels/roles/wallets and no data will be lost. But if the subscription is not renewed within 7 days, I will erase all data **permanently**, after which if you decide to use the bot, the users will have to submit wallets again and you will have to \`/setup\` again.`);
      await wait(2000);
      return await interaction.followUp(`I have sent a copy of above instructions in <#${outputChannel.id}> for future reference and for other team members to refer to.\n\nIf you ever face any issues, please contact us in our discord server.\nGoodluck! :slight_smile:`);
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