const configs = require('../models/configurations.js');
const subs = require('../models/subscriptions.js');
const defaults = require('../models/defaults.js');
const { EmbedBuilder } = require('discord.js');
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder().setColor('#35FF6E').setDescription(des);
  return embed;
}
module.exports = {
  name: 'default-settings',
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      let arr = {};
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
              'The subscription for this server has expired, please contact ST6 to continue using the services.'
            ),
          ],
        });
      const managerRole = getRole.role;
      if (!interaction.member.roles.cache.has(managerRole))
        return interaction.editReply({
          content: `Only <@&${managerRole}> can use this command.`,
        });
      const botRole = interaction.guild.members.me.roles.botRole;
      let ping = interaction.options.getString('ping-role');
      let blacklistedRoles = interaction.options.getString('blacklist-roles');
      let bonus = interaction.options.getString('bonus-entries');
      let balReq = interaction.options.getNumber('minimum-balance');
      let reqRoles = interaction.options.getString('req-roles');
      let winnerRole = interaction.options.getRole('winner-role-add');
      if (
        !ping &&
        !blacklistedRoles &&
        !bonus &&
        !balReq &&
        !reqRoles &&
        !winnerRole
      )
        return interaction.editReply({
          embeds: [
            MakeEmbedDes(
              'Please fill atleast one option to add to default settings of this server.'
            ),
          ],
        });
      if (ping) {
        arr.ping = ping;
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
        arr.blacklistedRoles = blacklistedRoles;
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
        arr.bonus = bonus;
      }
      if (balReq) {
        arr.balReq = balReq;
      }
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
        arr.reqRoles = reqRoles;
      }
      if (winnerRole) {
        const position = botRole.comparePositionTo(winnerRole);
        if (position < 0) {
          return interaction.editReply(
            'My bot role should be higher than the winner role to let me assign it to users. Please go to server settings and drag my role above the winner role.'
          );
        }
        arr.winnerRole = winnerRole;
      }
      const find = await defaults.findOne({
        server_id: interaction.guildId,
      });
      if (find) {
        await defaults.deleteMany({
          server_id: interaction.guildId,
        });
      }
      await new defaults({
        server_id: interaction.guildId,
        defaults: arr,
      })
        .save()
        .then(() => {
          return interaction.editReply({
            embeds: [
              MakeEmbedDes(
                "Your default settings are successfully saved and will be applied when you choose to. After giveaway creation command, you will get an option to add these if you hadn't added the fields in command."
              ),
            ],
          });
        })
        .catch((e) => {
          console.log(e);
        });
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
        .send(`${client.user.username} has trouble in defaults.js -\n\n${e}`);
    }
  },
};
