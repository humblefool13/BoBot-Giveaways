const {
  ChannelType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ActionRowBuilder,
  PermissionsBitField,
} = require('discord.js');
const configs = require('../models/configurations.js');
const subs = require('../models/subscriptions.js');
const defaults = require('../models/defaults.js');
const { writeFileSync } = require('fs');
function findTimestamp(durationString) {
  const split = durationString.split(' ');
  let timestamp = Date.now();
  split.forEach((timeString) => {
    const TimeNumber = Number(
      timeString.trim().slice(0, timeString.length - 1)
    );
    if (timeString.includes('d')) {
      timestamp += TimeNumber * 24 * 60 * 60 * 1000;
    } else if (timeString.includes('h')) {
      timestamp += TimeNumber * 60 * 60 * 1000;
    } else if (timeString.includes('m')) {
      timestamp += TimeNumber * 60 * 1000;
    }
  });
  return timestamp;
}
function parseRoles(string) {
  let roles = [];
  const split = string.split(',');
  split.forEach((role) => {
    const trim = role.trim();
    const roleId = trim.slice(3, trim.length - 1);
    roles.push(roleId);
  });
  return roles;
}
function getEntries(string) {
  let arr = [];
  const split = string.split(',');
  split.forEach((roleEntry) => {
    let vari = roleEntry.trim();
    if (!vari.includes(' ')) {
      const role = vari.trim().slice(0, vari.indexOf('>') + 1);
      const entry = vari.slice(vari.indexOf('>') + 1);
      vari = [role, entry].join(' ');
    }
    const split2 = vari.replaceAll('  ', ' ').split(' ');
    const entry = Number(split2[1]);
    const role = split2[0].trim().slice(3, split2[0].trim().length - 1);
    arr.push([role, entry]);
  });
  return arr;
}
const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Enter')
    .setEmoji('1004086533910974605')
    .setCustomId('enter')
    .setStyle(ButtonStyle.Primary)
);
function processBonus(string) {
  let arr = [];
  const split = string.split(',');
  split.forEach((roleEntry) => {
    let vari = roleEntry.trim();
    if (!vari.includes(' ')) {
      const role = vari.trim().slice(0, vari.indexOf('>') + 1);
      const entry = vari.slice(vari.indexOf('>') + 1);
      vari = [role, entry].join(' ');
    }
    const split2 = vari.replaceAll('  ', ' ').split(' ');
    const entry = Number(split2[1]);
    const role = split2[0].trim().slice(3, split2[0].trim().length - 1);
    arr.push([role, entry].join('-'));
  });
  return arr.join(',');
}
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder().setColor('#35FF6E').setDescription(des);
  return embed;
}
function processFollow(input) {
  let exportString = '';
  const accounts = input.split(',');
  accounts.forEach((account) => {
    const username = account.trim().replaceAll('@', '');
    const url = `<https://twitter.com/${username}>`;
    const string = `\n[${username}](${url})`;
    exportString += string;
  });
  return exportString;
}
async function idsOfAccounts(accountNames) {
  let accounts = accountNames.split(',');
  accounts = accounts.map((account) => account.trim().replace('@', ''));
  const requestString = accounts.join(',');
  const url = `https://api.twitter.com/2/users/by?usernames=${requestString}`;
  const result = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.bearer_token}`,
    },
  });
  const response = await result.json();
  const data = response.data;
  const ids = data.map((account) => account.id);
  return ids.join('_');
}
function toggleButton(customId, message) {
  const MessageComponent = message.components;
  const buttonsInRow1 = MessageComponent[0].components;
  const buttonsInRow2 = MessageComponent[1].components;
  const customIdsInRow1 = buttonsInRow1.map((button) => button.data.custom_id);
  const customIdsInRow2 = buttonsInRow2.map((button) => button.data.custom_id);
  let newComponent = [];
  if (customIdsInRow1.includes(customId)) {
    const button = buttonsInRow1.find(
      (button) => customId === button.data.custom_id
    );
    const style = button.data.style;
    const newRow = new ActionRowBuilder();
    for (let rowButton of buttonsInRow1) {
      if (rowButton.data.custom_id === customId) {
        newRow.addComponents(
          new ButtonBuilder()
            .setLabel(button.data.label)
            .setStyle(
              style === 'Danger' || style === ButtonStyle.Danger
                ? ButtonStyle.Success
                : ButtonStyle.Danger
            )
            .setCustomId(button.data.custom_id)
        );
      } else {
        newRow.addComponents(rowButton);
      }
    }
    newComponent.push(newRow);
    newComponent.push(MessageComponent[1]);
    newComponent.push(MessageComponent[2]);
  } else {
    newComponent.push(MessageComponent[0]);
    const button = buttonsInRow2.find(
      (button) => customId === button.data.custom_id
    );
    const style = button.data.style;
    const newRow = new ActionRowBuilder();
    for (let rowButton of buttonsInRow2) {
      if (rowButton.data.custom_id === customId) {
        newRow.addComponents(
          new ButtonBuilder()
            .setLabel(button.data.label)
            .setStyle(
              style === 'Danger' || style === ButtonStyle.Danger
                ? ButtonStyle.Success
                : ButtonStyle.Danger
            )
            .setCustomId(button.data.custom_id)
        );
      } else {
        newRow.addComponents(rowButton);
      }
    }
    newComponent.push(newRow);
    newComponent.push(MessageComponent[2]);
  }
  return newComponent;
}

module.exports = {
  name: 'giveaway',
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const sub = subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub)
        return interaction.editReply({
          embeds: [
            MakeEmbedDes(
              'The subscription for this server has expired, please contact ST6 to continue using the services.'
            ),
          ],
        });
      const getRole = await configs.findOne({
        server_id: interaction.guildId,
      });
      if (!getRole)
        return interaction.editReply({
          embeds: [
            MakeEmbedDes(
              'You need to `/setup` before using this command, or the subscription for this server has expired, please contact ST6 to continue using the services.'
            ),
          ],
        });
      const giveawayChannel = getRole.giveaways_channel;
      const managerRole = getRole.role;
      if (!interaction.member.roles.cache.has(managerRole))
        return interaction.editReply({
          content: `Only <@&${managerRole}> can use this command.`,
        });
      let defaultsData = await defaults.findOne({
        server_id: interaction.guildId,
      });
      if (defaultsData) defaultsData = defaultsData.defaults;
      if (!defaultsData) defaultsData = {};
      const botRole = interaction.guild.members.me.roles.botRole;
      const prize = interaction.options.getString('prize');
      const winners = interaction.options.getInteger('winners');
      const walletReq = interaction.options.getBoolean('wallet-req');
      const time = interaction.options.getString('duration');
      const description = interaction.options.getString('description');
      let ping = interaction.options.getString('ping-role');
      let blacklistedRoles = interaction.options.getString('blacklist-roles');
      let bonus = interaction.options.getString('bonus-entries');
      let balReq = interaction.options.getNumber('minimum-balance');
      let reqRoles = interaction.options.getString('roles-req');
      let winnerRole = interaction.options.getRole('winner-role-add');
      const picture = interaction.options.getAttachment('attach-picture');
      const followReq = interaction.options.getString('follow-twit-req');
      const likeReq = interaction.options.getString('like-twit-req');
      const rtReq = interaction.options.getString('rt-twit-req');
      const guildMemberReq =
        interaction.options.getString('discord-member-req');
      const chain = interaction.options.getString('blockchain');
      const type = interaction.options.getString('type');
      const socialDiscord = interaction.options.getString('socials-discord');
      const socialTwitter = interaction.options.getString('socials-twitter');
      const pubPrice = interaction.options.getString('mint-price-public');
      const privPrice = interaction.options.getString('mint-price-presale');
      const mintTime = interaction.options.getString('mint-time');
      const endTimestamp = findTimestamp(time.toLowerCase().trim());
      if (chain !== 'Ethereum' && balReq) {
        return interaction.editReply({
          content:
            'The balance requirement is only supported for Ethereum blockchain.',
        });
      }
      let guildId;
      if (guildMemberReq) {
        const invite = await client.fetchInvite(guildMemberReq);
        guildId = invite.guild.id;
        if (invite.expiresTimestamp <= endTimestamp) {
          return interaction.editReply(
            'The required discord server invite link expires before giveaway ends. Please get a new link that is valid atleast till giveaway end time.'
          );
        }
      }
      if (description) {
        if (description.length > 3000)
          return interaction.editReply(
            'Please make sure the description does not exceed 3000 characters.'
          );
      }
      const row1 = new ActionRowBuilder();
      const row2 = new ActionRowBuilder();
      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Skip')
          .setStyle(ButtonStyle.Primary)
          .setCustomId('skip'),
        new ButtonBuilder()
          .setLabel('Done')
          .setStyle(ButtonStyle.Success)
          .setCustomId('done')
      );
      let rowsIds = ['done', 'skip'];
      if (!ping && defaultsData?.ping) {
        row1.addComponents(
          new ButtonBuilder()
            .setLabel('1')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultPing')
        );
        rowsIds.push('defaultPing');
      } else {
        row1.addComponents(
          new ButtonBuilder()
            .setLabel('1')
            .setDisabled(true)
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultPing')
        );
        rowsIds.push('defaultPing');
      }
      if (!blacklistedRoles && defaultsData?.blacklistedRoles) {
        row1.addComponents(
          new ButtonBuilder()
            .setLabel('2')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultBL')
        );
        rowsIds.push('defaultBL');
      } else {
        row1.addComponents(
          new ButtonBuilder()
            .setLabel('2')
            .setDisabled(true)
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultBL')
        );
        rowsIds.push('defaultBL');
      }
      if (!bonus && defaultsData?.bonus) {
        row1.addComponents(
          new ButtonBuilder()
            .setLabel('3')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultBonus')
        );
        rowsIds.push('defaultBonus');
      } else {
        row1.addComponents(
          new ButtonBuilder()
            .setLabel('3')
            .setDisabled(true)
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultBonus')
        );
        rowsIds.push('defaultBonus');
      }
      if (!balReq && defaultsData?.balReq) {
        row2.addComponents(
          new ButtonBuilder()
            .setLabel('4')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultBal')
        );
        rowsIds.push('defaultBal');
      } else {
        row2.addComponents(
          new ButtonBuilder()
            .setLabel('4')
            .setDisabled(true)
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultBal')
        );
        rowsIds.push('defaultBal');
      }
      if (!reqRoles && defaultsData?.reqRoles) {
        row2.addComponents(
          new ButtonBuilder()
            .setLabel('5')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultRoles')
        );
        rowsIds.push('defaultRoles');
      } else {
        row2.addComponents(
          new ButtonBuilder()
            .setLabel('5')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
            .setCustomId('defaultRoles')
        );
        rowsIds.push('defaultRoles');
      }
      if (!winnerRole && defaultsData?.winnerRole) {
        row2.addComponents(
          new ButtonBuilder()
            .setLabel('6')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultWinner')
        );
        rowsIds.push('defaultWinner');
      } else {
        row2.addComponents(
          new ButtonBuilder()
            .setLabel('6')
            .setDisabled(true)
            .setStyle(ButtonStyle.Danger)
            .setCustomId('defaultWinner')
        );
        rowsIds.push('defaultWinner');
      }
      if (row1.components.length || row2.components.length) {
        let compArray = [];
        if (row1.components.length) {
          compArray.push(row1);
        }
        if (row2.components.length) {
          compArray.push(row2);
        }
        compArray.push(row3);
        const sent = await interaction.editReply({
          embeds: [
            MakeEmbedDes(
              `Would you like to apply any of the default settings?\nYou have 2 minutes to choose.\n\n1) Default Message Ping\n2) Default Blacklisted Roles\n3) Default Bonus Entries\n4) Default Ethereum Balance Requirement\n5) Default Required Roles\n6) Default Winner Role\n\nSome options might be disabled because the default fields were not saved for them.`
            ),
          ],
          components: compArray,
          fetchReply: true,
        });
        let doneFields = [];
        const filter = (int) =>
          int.user.id === interaction.user.id && rowsIds.includes(int.customId);
        const collector = await sent.createMessageComponentCollector({
          filter,
          componentType: ComponentType.Button,
          time: 120000,
        });
        collector.on('collect', async (i) => {
          await i.deferUpdate();
          if (i.customId === 'done' || i.customId === 'skip') {
            await interaction.editReply({
              content: 'Processing <a:loading:973124874124005396>',
              components: [],
              embeds: [],
            });
            return collector.stop();
          }
          const newMessageComponent = toggleButton(i.customId, i.message);
          if (doneFields.includes(i.customId)) {
            const index = doneFields.indexOf(i.customId);
            doneFields.splice(index, 1);
          } else {
            if (i.customId === 'defaultPing') {
              doneFields.push(i.customId);
            }
            if (i.customId === 'defaultBL') {
              doneFields.push(i.customId);
            }
            if (i.customId === 'defaultBonus') {
              doneFields.push(i.customId);
            }
            if (i.customId === 'defaultBal') {
              doneFields.push(i.customId);
            }
            if (i.customId === 'defaultRoles') {
              doneFields.push(i.customId);
            }
            if (i.customId === 'defaultWinner') {
              doneFields.push(i.customId);
            }
          }
          await i.editReply({
            embeds: [
              MakeEmbedDes(
                `Would you like to apply any of the default settings?\nYou have 2 minutes to choose.\n\n1) Default Message Ping\n2) Default Blacklisted Roles\n3) Default Bonus Entries\n4) Default Ethereum Balance Requirement\n5) Default Required Roles\n6) Default Winner Role\n\nSome options might be disabled because the default fields were not saved for them.`
              ),
            ],
            components: newMessageComponent,
          });
        });
        collector.on('end', async () => {
          for (let choseOption of doneFields) {
            switch (choseOption) {
              case 'defaultPing':
                ping = defaultsData.ping;
                break;
              case 'defaultBL':
                blacklistedRoles = defaultsData.blacklistedRoles;
                break;
              case 'defaultBonus':
                bonus = defaultsData.bonus;
                break;
              case 'defaultBal':
                balReq = defaultsData.balReq;
                break;
              case 'defaultRoles':
                reqRoles = defaultsData.reqRoles;
                break;
              case 'defaultWinner':
                winnerRole = defaultsData.winnerRole;
                break;
            }
          }
          if (blacklistedRoles) {
            let roles = 0;
            for (i = 0; i < blacklistedRoles.length; i++) {
              const char = blacklistedRoles.charAt(i);
              const char2 = blacklistedRoles.charAt(i + 1);
              if (char === '@' && char2 === '&') roles++;
            }
            let commas = 0;
            for (i = 0; i < blacklistedRoles.length; i++) {
              const char = blacklistedRoles.charAt(i);
              if (char === ',') commas++;
            }
            if (roles - 1 !== commas)
              return interaction.editReply(
                `Please enter the blacklisted roles in correct format.\nexample:\nFor 1 role: \`@role\`\nFor multiple roles: Mention all roles and they **must be separated by commas ","**:\n\`@role1, @role2, @role3 ( ... )\``
              );
          }
          if (bonus) {
            let roles = 0;
            for (i = 0; i < bonus.length; i++) {
              const char = bonus.charAt(i);
              const char2 = bonus.charAt(i + 1);
              if (char === '@' && char2 === '&') roles++;
            }
            let commas = 0;
            for (i = 0; i < bonus.length; i++) {
              const char = bonus.charAt(i);
              if (char === ',') commas++;
            }
            if (roles - 1 !== commas)
              return interaction.editReply(
                `Please enter the bonus roles in correct format.\nexample:\nFor 1 role: \`@role 5\`\nFor multiple roles: Mention the roles and state number of entries ( **separated by space** ) and the roles **must be separated by commas ","**:\n\`@role1 5, @role2 6, @role3 7 ( ... )\``
              );
          }
          if (balReq && !walletReq)
            return interaction.editReply(
              'Minimum balance requirement is only supported in giveaways with wallet required set to true.'
            );
          if (reqRoles) {
            let roles = 0;
            for (i = 0; i < reqRoles.length; i++) {
              const char = reqRoles.charAt(i);
              const char2 = reqRoles.charAt(i + 1);
              if (char === '@' && char2 === '&') roles++;
            }
            let commas = 0;
            for (i = 0; i < reqRoles.length; i++) {
              const char = reqRoles.charAt(i);
              if (char === ',') commas++;
            }
            if (roles - 1 !== commas)
              return interaction.editReply(
                `Please enter the role requirements in correct format.\nexample:\nFor 1 role: \`@role\`\nFor multiple roles: Mention all roles and they **must be separated by commas ","**:\n\`@role1, @role2, @role3 ( ... )\``
              );
          }
          let followRequirement;
          if (followReq) followRequirement = processFollow(followReq);
          let descriptionString = '';
          descriptionString += `:trophy: **Prize Name** : ${prize}\n\n`;
          if (description) {
            descriptionString += description + '\n\n';
          }
          if (socialDiscord || socialTwitter) {
            let socialString = '';
            if (socialTwitter) {
              socialString += `<:Twitter:1003000521214402680> [Twitter](${socialTwitter})`;
            }
            if (socialDiscord) {
              socialString += `  <:discordn:1014982172240789505> [Discord](${socialDiscord})`;
            }
            descriptionString += `:handshake: **Socials**: ${socialString}\n\n`;
          }
          descriptionString += `:crown: **Winners** : ${winners}\n\n`;
          descriptionString += `:link: **Chain**: ${chain}\n\n`;
          descriptionString += `:grey_exclamation: **Type**: ${type}\n\n`;
          descriptionString += `:stopwatch: **Ending** : <t:${parseInt(
            endTimestamp / 1000
          )}:f> ( <t:${parseInt(endTimestamp / 1000)}:R> )\n\n`;
          descriptionString += `<:wallet:1030387510372741150> **Wallet Required** : ${
            walletReq ? 'Yes' : 'No'
          }\n\n`;
          if (pubPrice || privPrice) {
            let mintPriceString = '';
            if (pubPrice) {
              mintPriceString += ` Public Price = ${pubPrice}`;
            }
            if (privPrice && pubPrice) {
              mintPriceString += `\n Presale Price = ${privPrice}`;
            } else if (privPrice && !pubPrice) {
              mintPriceString += ` Presale Price = ${privPrice}`;
            }
            descriptionString += `:dollar: **Mint Price**:\n${mintPriceString}\n\n`;
          }
          if (balReq)
            descriptionString += `<:ethereum:997764237025890318> **Minimum Balance Required** : ${balReq} Ξ\n\n`;
          if (winnerRole) {
            const roleFromId = interaction.guild.roles.cache.get(winnerRole);
            const position = botRole.comparePositionTo(roleFromId);
            if (position < 0) {
              return interaction.editReply(
                'My bot role should be higher than the winner role to let me assign it to users. Please go to server settings and drag my role above the winner role.'
              );
            }
            descriptionString += `:military_medal: **Role Awarded to Winners** : <@&${winnerRole}>\n\n`;
          }
          if (reqRoles) {
            let reqroles = parseRoles(reqRoles);
            reqroles = reqroles.join('>, <@&');
            reqroles = `<@&${reqroles}>`;
            descriptionString += `:lock: **Must have any of these roles** :\n${reqroles}\n\n`;
          }
          if (blacklistedRoles) {
            let blacklist = parseRoles(blacklistedRoles);
            blacklist = blacklist.join('>, <@&');
            blacklist = `<@&${blacklist}>`;
            descriptionString += `:x: **Must __*not*__ have any of these roles** :\n${blacklist}\n\n`;
          }
          if (bonus) {
            let entries = getEntries(bonus);
            descriptionString =
              descriptionString +
              ':busts_in_silhouette: **Multiple Entries** :\n';
            entries.forEach((roleArray) => {
              descriptionString =
                descriptionString +
                `<@&${roleArray[0]}> +${roleArray[1]} Entries\n`;
            });
            descriptionString = descriptionString + '\n';
          }
          if (followReq) {
            descriptionString += `:small_red_triangle: **Must follow these account(s)** : ${followRequirement}\n\n`;
          }
          if (likeReq) {
            descriptionString += `:heart: **Must like this tweet** : \n${likeReq}\n\n`;
          }
          if (rtReq) {
            descriptionString += `:arrows_clockwise: **Must retweet this tweet** : \n${rtReq}\n\n`;
          }
          if (guildMemberReq) {
            descriptionString += `:point_right: **Must join this server** : \n${guildMemberReq}\n\n`;
          }
          const embed = new EmbedBuilder()
            .setTitle('Active Giveaway')
            .setDescription(descriptionString)
            .setColor('#35FF6E');
          if (picture && picture.contentType.startsWith('image')) {
            embed.setImage(picture.url);
          }
          const postChannel = await client.guilds.cache
            .get(interaction.guild.id)
            .channels.fetch(giveawayChannel);
          let ids, idsArr;
          if (followReq) {
            ids = await idsOfAccounts(followReq);
            idsArr = ids.split('_');
          }
          if (idsArr?.length > 5) {
            return interaction.editReply({
              content:
                'A maximum of 5 twitter accounts can be set to put for follow requirement.',
            });
          }
          let sent;
          if (ping) {
            sent = await postChannel.send({
              content: ping,
              embeds: [embed],
              components: [row],
            });
          } else {
            sent = await postChannel.send({
              embeds: [embed],
              components: [row],
            });
          }
          const filename =
            '/' +
            [interaction.guildId, giveawayChannel, sent.id].join('_') +
            '.txt';
          const data = [
            prize,
            winners,
            walletReq ? 'YES' : 'NO',
            endTimestamp,
            balReq ? balReq : 'NA',
            winnerRole ? winnerRole : 'NA',
            reqRoles ? parseRoles(reqRoles).join(',') : 'NA',
            blacklistedRoles ? parseRoles(blacklistedRoles).join(',') : 'NA',
            bonus ? processBonus(bonus) : 'NA',
            followReq ? ids : 'NA',
            likeReq ? likeReq : 'NA',
            rtReq ? rtReq : 'NA',
            guildId ? guildId : 'NA',
            sent.url,
            mintTime ? mintTime : 'NA',
            chain ? chain : 'NA',
            guildMemberReq ? guildMemberReq : 'NA',
          ];
          writeFileSync(
            './giveaways/giveawayConfigs' + filename,
            data.join('\n')
          );
          writeFileSync('./giveaways/giveawayEntries' + filename, '');
          const messageLinkRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Jump to Giveaway')
              .setStyle(ButtonStyle.Link)
              .setURL(sent.url)
          );
          return interaction.editReply({
            content: `✅ Successfully created the giveaway`,
            components: [messageLinkRow],
          });
        });
      } else {
        if (blacklistedRoles) {
          let roles = 0;
          for (i = 0; i < blacklistedRoles.length; i++) {
            const char = blacklistedRoles.charAt(i);
            const char2 = blacklistedRoles.charAt(i + 1);
            if (char === '@' && char2 === '&') roles++;
          }
          let commas = 0;
          for (i = 0; i < blacklistedRoles.length; i++) {
            const char = blacklistedRoles.charAt(i);
            if (char === ',') commas++;
          }
          if (roles - 1 !== commas)
            return interaction.editReply(
              `Please enter the blacklisted roles in correct format.\nexample:\nFor 1 role: \`@role\`\nFor multiple roles: Mention all roles and they **must be separated by commas ","**:\n\`@role1, @role2, @role3 ( ... )\``
            );
        }
        if (bonus) {
          let roles = 0;
          for (i = 0; i < bonus.length; i++) {
            const char = bonus.charAt(i);
            const char2 = bonus.charAt(i + 1);
            if (char === '@' && char2 === '&') roles++;
          }
          let commas = 0;
          for (i = 0; i < bonus.length; i++) {
            const char = bonus.charAt(i);
            if (char === ',') commas++;
          }
          if (roles - 1 !== commas)
            return interaction.editReply(
              `Please enter the bonus roles in correct format.\nexample:\nFor 1 role: \`@role 5\`\nFor multiple roles: Mention the roles and state number of entries ( **separated by space** ) and the roles **must be separated by commas ","**:\n\`@role1 5, @role2 6, @role3 7 ( ... )\``
            );
        }
        if (balReq && !walletReq)
          return interaction.editReply(
            'Minimum balance requirement is only supported in giveaways with wallet required set to true.'
          );
        if (reqRoles) {
          let roles = 0;
          for (i = 0; i < reqRoles.length; i++) {
            const char = reqRoles.charAt(i);
            const char2 = reqRoles.charAt(i + 1);
            if (char === '@' && char2 === '&') roles++;
          }
          let commas = 0;
          for (i = 0; i < reqRoles.length; i++) {
            const char = reqRoles.charAt(i);
            if (char === ',') commas++;
          }
          if (roles - 1 !== commas)
            return interaction.editReply(
              `Please enter the role requirements in correct format.\nexample:\nFor 1 role: \`@role\`\nFor multiple roles: Mention all roles and they **must be separated by commas ","**:\n\`@role1, @role2, @role3 ( ... )\``
            );
        }
        let followRequirement;
        if (followReq) followRequirement = processFollow(followReq);
        let descriptionString = '';
        descriptionString += `:trophy: **Prize Name** : \`${prize}\`\n\n`;
        if (description) {
          descriptionString += description + '\n\n';
        }
        if (socialDiscord || socialTwitter) {
          let socialString = '';
          if (socialTwitter) {
            socialString += `<:Twitter:1003000521214402680> [Twitter](${socialTwitter})`;
          }
          if (socialDiscord) {
            socialString += `  <:discordn:1014982172240789505> [Discord](${socialDiscord})`;
          }
          descriptionString += `:handshake: **Socials**: ${socialString}\n\n`;
        }
        descriptionString += `:crown: **Winners** : ${winners}\n\n`;
        descriptionString += `:link: **Chain**: ${chain}\n\n`;
        descriptionString += `:grey_exclamation: **Type**: ${type}\n\n`;
        descriptionString += `:stopwatch: **Ending** : <t:${parseInt(
          endTimestamp / 1000
        )}:f> ( <t:${parseInt(endTimestamp / 1000)}:R> )\n\n`;
        descriptionString += `<:wallet:1030387510372741150> **Wallet Required** : ${
          walletReq ? 'Yes' : 'No'
        }\n\n`;
        if (pubPrice || privPrice) {
          let mintPriceString = '';
          if (pubPrice) {
            mintPriceString += ` Public Price = ${pubPrice}`;
          }
          if (privPrice && pubPrice) {
            mintPriceString += `\n Presale Price = ${privPrice}`;
          } else if (privPrice && !pubPrice) {
            mintPriceString += ` Presale Price = ${privPrice}`;
          }
          descriptionString += `:dollar: **Mint Price**:\n${mintPriceString}\n\n`;
        }
        if (balReq)
          descriptionString += `<:ethereum:997764237025890318> **Minimum Balance Required** : ${balReq} Ξ\n\n`;
        if (winnerRole) {
          const position = botRole.comparePositionTo(winnerRole);
          if (position < 0) {
            return interaction.editReply(
              'My bot role should be higher than the winner role to let me assign it to users. Please go to server settings and drag my role above the winner role.'
            );
          }
          descriptionString += `:military_medal: **Role Awarded to Winners** : <@&${winnerRole}>\n\n`;
        }
        if (reqRoles) {
          let reqroles = parseRoles(reqRoles);
          reqroles = reqroles.join('>, <@&');
          reqroles = `<@&${reqroles}>`;
          descriptionString += `:lock: **Must have any of these roles** :\n${reqroles}\n\n`;
        }
        if (blacklistedRoles) {
          let blacklist = parseRoles(blacklistedRoles);
          blacklist = blacklist.join('>, <@&');
          blacklist = `<@&${blacklist}>`;
          descriptionString += `:x: **Must __*not*__ have any of these roles** :\n${blacklist}\n\n`;
        }
        if (bonus) {
          let entries = getEntries(bonus);
          descriptionString =
            descriptionString +
            ':busts_in_silhouette: **Multiple Entries** :\n';
          entries.forEach((roleArray) => {
            descriptionString =
              descriptionString +
              `<@&${roleArray[0]}> +${roleArray[1]} Entries\n`;
          });
          descriptionString = descriptionString + '\n';
        }
        if (followReq) {
          descriptionString += `:small_red_triangle: **Must follow these account(s)** : ${followRequirement}\n\n`;
        }
        if (likeReq) {
          descriptionString += `:heart: **Must like this tweet** : \n${likeReq}\n\n`;
        }
        if (rtReq) {
          descriptionString += `:arrows_clockwise: **Must retweet this tweet** : \n${rtReq}\n\n`;
        }
        if (guildMemberReq) {
          descriptionString += `:point_right: **Must join this server** : \n${guildMemberReq}\n\n`;
        }
        const embed = new EmbedBuilder()
          .setTitle('Active Giveaway')
          .setDescription(descriptionString)
          .setColor('#35FF6E');
        if (picture && picture.contentType.startsWith('image')) {
          embed.setImage(picture.url);
        }
        const postChannel = await client.guilds.cache
          .get(interaction.guild.id)
          .channels.fetch(giveawayChannel);
        let ids, idsArr;
        if (followReq) {
          ids = await idsOfAccounts(followReq);
          idsArr = ids.split('_');
        }
        if (idsArr?.length > 5) {
          return interaction.editReply({
            content:
              'A maximum of 5 twitter accounts can be set to put for follow requirement.',
          });
        }
        let sent;
        if (ping) {
          sent = await postChannel.send({
            content: ping,
            embeds: [embed],
            components: [row],
          });
        } else {
          sent = await postChannel.send({
            embeds: [embed],
            components: [row],
          });
        }
        const filename =
          '/' +
          [interaction.guildId, giveawayChannel, sent.id].join('_') +
          '.txt';
        const data = [
          prize,
          winners,
          walletReq ? 'YES' : 'NO',
          endTimestamp,
          balReq ? balReq : 'NA',
          winnerRole ? winnerRole.id : 'NA',
          reqRoles ? parseRoles(reqRoles).join(',') : 'NA',
          blacklistedRoles ? parseRoles(blacklistedRoles).join(',') : 'NA',
          bonus ? processBonus(bonus) : 'NA',
          followReq ? ids : 'NA',
          likeReq ? likeReq : 'NA',
          rtReq ? rtReq : 'NA',
          guildId ? guildId : 'NA',
          sent.url,
          mintTime ? mintTime : 'NA',
          chain ? chain : 'NA',
          guildMemberReq ? guildMemberReq : 'NA',
        ];
        writeFileSync(
          './giveaways/giveawayConfigs' + filename,
          data.join('\n')
        );
        writeFileSync('./giveaways/giveawayEntries' + filename, '');
        const messageLinkRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Jump to Giveaway')
            .setStyle(ButtonStyle.Link)
            .setURL(sent.url)
        );
        return interaction.editReply({
          content: `✅ Successfully created the giveaway`,
          components: [messageLinkRow],
        });
      }
    } catch (e) {
      console.log(e);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content:
            'I am facing some trouble, the dev has been informed. Please try again in some hours.',
          embeds: [],
          components: [],
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            'I am facing some trouble, the dev has been informed. Please try again in some hours.',
          embeds: [],
          components: [],
          ephemeral: true,
        });
      }
      client.users.cache
        .get('727498137232736306')
        .send(`${client.user.username} has trouble in giveaway.js -\n\n${e}`);
    }
  },
};
