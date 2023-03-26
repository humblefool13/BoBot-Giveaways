const subs = require('../models/subscriptions.js');
const configs = require('../models/configurations.js');
const wait = require('node:timers/promises').setTimeout;
const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js');

function makeEmbed(name, guild_icon, guild_id) {
  const embed = new EmbedBuilder()
    .setTitle('Account Configuration')
    .setDescription(
      `Welcome to SnapBot! :wave:\n\n<a:hexstar:1002639618409250836> __${name}__ uses **SnapBot** for the most advanced and user-friendly giveaway operations.\n\n<a:hexstar:1002639618409250836> Everytime you win a giveaway, your wallet addresses are instantly and automatically recorded.\n\nPlease follow these instructions for account configuration:\nStep 1: Click the button of the **corresponding blockchains** below and submit your wallets! We highly recommend you use burner wallets.\nStep 2: Click the **Authorize Discord & Twitter** button and connect your Discord and Twitter accounts. (You are free to revoke this access anytime, you can do so by simply clicking on the **Revoke Discord & Twitter** button.)\n\nYou are now good to go. You can click the **Check Saved Info** button to see if all the information you have submitted is correct! If you want to change your information, please repeat Step 1 or Step 2.`
    )
    .setColor('#35FF6E');
  if (guild_icon.startsWith('a_') && guild_icon !== 'N') {
    embed.setThumbnail(
      `https://cdn.discordapp.com/icons/${guild_id}/${guild_icon}.gif`
    );
  } else if (!guild_icon.startsWith('a_') && guild_icon !== 'N') {
    embed.setThumbnail(
      `https://cdn.discordapp.com/icons/${guild_id}/${guild_icon}.png`
    );
  }
  return embed;
}
const row1 = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Wallets:')
    .setCustomId('disabledLOL')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true)
    .setEmoji('📝'),
  new ButtonBuilder()
    .setLabel('Ethereum')
    .setCustomId('ethereumWallet')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('997764237025890318'),
  new ButtonBuilder()
    .setLabel('Solana')
    .setCustomId('solanaWallet')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('1026406242370990102'),
  new ButtonBuilder()
    .setLabel('Aptos')
    .setCustomId('aptosWallet')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('1077708380703051797'),
  new ButtonBuilder()
    .setLabel('MultiversX')
    .setCustomId('multiversxWallet')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('1077709867889995846')
);
const row2 = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Connections:')
    .setCustomId('disabledLOL2')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true)
    .setEmoji('🔗'),
  new ButtonBuilder()
    .setLabel('Authorize Discord & Twitter')
    .setCustomId('authorizeConnections')
    .setStyle(ButtonStyle.Success)
    .setEmoji('☑️'),
  new ButtonBuilder()
    .setLabel('Revoke Discord & Twitter')
    .setCustomId('revokeConnections')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('❎')
);
const row3 = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Check Saved Info')
    .setCustomId('check')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🔎')
);
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder().setColor('#35FF6E').setDescription(des);
  return embed;
}

module.exports = {
  name: 'setup',
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const timezone = interaction.options.getString('server_timezone');
      if (
        !interaction.memberPermissions?.has(
          PermissionsBitField.Flags.Administrator
        ) &&
        !interaction.memberPermissions?.has(
          PermissionsBitField.Flags.ManageGuild
        ) &&
        interaction.user.id !== interaction.guild?.ownerId
      )
        return interaction.editReply({
          embeds: [
            MakeEmbedDes(
              'You do not have access to this command.\nYou must fulfill one of the following conditions:\n1) You are the Owner of this Discord Server.\n2) You have the **ADMINISTRATOR** permission on the server.\n3) You have the **MANAGE SERVER** permission on the server.'
            ),
          ],
          ephemeral: true,
        });
      const sub = subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub)
        return interaction.editReply({
          embeds: [
            MakeEmbedDes(
              'SnapBot subscription for this server has expired, please contact ST6 to continue using our services.'
            ),
          ],
        });
      const category = await interaction.guild.channels.create({
        name: 'SNAPBOT',
        type: ChannelType.GuildCategory,
      });
      const role = await interaction.guild.roles.create({
        name: 'Giveaway Manager',
        color: '#8A45FF',
        reason: 'The role for Giveaway Manager.',
      });
      const outputChannel = await interaction.guild.channels.create({
        name: '🔐︱giveaway-managers',
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.guildId,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.EmbedLinks,
              PermissionsBitField.Flags.AttachFiles,
            ],
          },
          {
            id: role.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      const setupChannel = await interaction.guild.channels.create({
        name: '✅︱submit-info',
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.guildId,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.EmbedLinks,
              PermissionsBitField.Flags.AttachFiles,
            ],
          },
          {
            id: role.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      const giveawaysChannel = await interaction.guild.channels.create({
        name: '🎉︱giveaways',
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.guildId,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.EmbedLinks,
              PermissionsBitField.Flags.AttachFiles,
            ],
          },
          {
            id: role.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      const winnerChannel = await interaction.guild.channels.create({
        name: '👑︱winners',
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.guildId,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.EmbedLinks,
              PermissionsBitField.Flags.AttachFiles,
            ],
          },
          {
            id: role.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      const reminderChannel = await interaction.guild.channels.create({
        name: '⏰︱reminders',
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.guildId,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.EmbedLinks,
              PermissionsBitField.Flags.AttachFiles,
            ],
          },
          {
            id: role.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });
      await configs.deleteOne({
        server_id: interaction.guildId,
      });
      await new configs({
        server_id: interaction.guildId,
        expired: false,
        expired_timestamp: 0,
        role: role.id,
        server_timezone: timezone,
        submit_channel: outputChannel.id,
        winners_channel: winnerChannel.id,
        reminders_channel: reminderChannel.id,
        giveaways_channel: giveawaysChannel.id,
      })
        .save()
        .catch((e) => {
          console.log(e);
        });
      const embed = makeEmbed(
        interaction.guild.name,
        interaction.guild.icon ? interaction.guild.icon : 'N',
        interaction.guildId
      );
      await setupChannel.send({
        embeds: [embed],
        components: [row1, row2, row3],
      });

      const stepTwo = `2) I have made 5 channels:\n:white_small_square: <#${setupChannel.id}>:\nThis is the channel where your community members will be able to submit and check their information. Please make sure the desired roles have these permissions enabled in this channel: "View Channel" and "Read Message History".\n\n:white_small_square: <#${giveawaysChannel.id}>:\nAll SnapBot giveaways will be posted in this channel. Please make sure the desired roles have these permissions enabled in this channel: "View Channel" and "Read Message History".:\n\n:white_small_square: <#${winnerChannel.id}>:\nThis is the channel where the winners of every giveaway will be announced. Please make sure the desired roles have these permissions enabled in this channel: "View Channel" and "Read Message History". Please also make sure that SnapBot always has these permissions enabled in this channel: "View Channel", "Send Messages", "Embed Links" and "Mention @everyone, @here and All Roles".\n\n:white_small_square: <#${reminderChannel.id}>:\nThis is the channel where the winners of every giveaway will be pinged 10 minutes before a project mints. Please make sure the desired roles have these permissions enabled in this channel: "View Channel" and "Read Message History". Please also make sure that SnapBot always has these permissions enabled in this channel: "View Channel", "Send Messages", "Embedded Links" and "Mention @everyone, @here and All Roles".\n\n:white_small_square: <#${outputChannel.id}>:\nThis is the channel where you will receive the files with winners' details after the end of every giveaway. Please make sure that SnapBot always has these permissions enabled: "View Channel", "Send Messages", "Embedded Links" and "Attach Files". Keep this channel private, <@&${role.id}> I created, the Discord server owner, and roles with "ADMINISTRATOR" permission can see the channel by default while everyone else will not be able to.\n\nYou can change the name or the position of the channels but if you delete any one of the channels you will have to perform the \`/setup\` command again.`;

      let des = [':ledger: Welcome to SnapBot! Please read the following instructions before you begin:', `1) I have made a role <@&${role.id}> who will be able to use giveaway management commands. Please head over to server settings and put the role in a high hierarchical position to ensure the bot functions correctly. A member must have this role in order to set up giveaways and be able to access giveaway results. You can change the name or the color of the role but if you delete the role you will have to perform the  \`/setup\` command again.`, stepTwo, `3) If you need help with setting up a giveaway, please perform the  \`/help\` command.\n\n4) Once your subscription ends, I will keep all configurations and user information saved for 7 days. Everything will continue to function correctly as long as you renew your subscription within 7 days. If the subscription is not renewed within 7 days, SnapBot will erase all data **permanently**. After which if you decide to use SnapBot again, you will have to perform the \`/setup\` command again and your community will have to resubmit their information.`].join("\n\n");
      await interaction.editReply(
        ':ledger: Welcome to SnapBot! Please read the following instructions before you begin:'
      );
      await wait(2000);
      await interaction.followUp({
        content: `1) I have made a role <@&${role.id}> who will be able to use giveaway management commands. Please head over to server settings and put the role in a high hierarchical position to ensure the bot functions correctly. A member must have this role in order to set up giveaways and be able to access giveaway results. You can change the name or the color of the role but if you delete the role you will have to perform the  \`/setup\` command again.`,
        ephemeral: true,
      });
      await wait(2000);
      await interaction.followUp({
        content: stepTwo,
        ephemeral: true,
      });
      await wait(2000);
      await interaction.followUp({
        content: `3) If you need help with setting up a giveaway, please perform the  \`/help\` command.\n\n4) Once your subscription ends, I will keep all configurations and user information saved for 7 days. Everything will continue to function correctly as long as you renew your subscription within 7 days. If the subscription is not renewed within 7 days, SnapBot will erase all data **permanently**. After which if you decide to use SnapBot again, you will have to perform the \`/setup\` command again and your community will have to resubmit their information.`,
        ephemeral: true,
      });
      await wait(2000);
      await outputChannel.send({ embeds: [MakeEmbedDes(des)] });
      return await interaction.followUp({
        content: `I have sent a copy of above instructions in <#${outputChannel.id}> for future reference and for other team members to refer to.\n\nIf you ever face any issues, please contact ST6.\nHappy Raffling! :slight_smile:`,
        ephemeral: true,
      });
    } catch (e) {
      console.log(e);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content:
            'I am having some trouble, the developer has been informed. Please try again in a few hours.',
          embeds: [],
          components: [],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            'I am having some trouble, the developer has been informed. Please try again in a few hours.',
          embeds: [],
          components: [],
          ephemeral: true,
        });
      }
      client.users.cache
        .get('727498137232736306')
        .send(`${client.user.username} has trouble in setup.js -\n\n${e}`);
    }
  },
};