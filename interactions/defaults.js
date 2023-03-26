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
              'SnapBot subscription for this server has expired, please contact ST6 to continue using our services.'
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
              'SnapBot subscription for this server has expired, please contact ST6 to continue using our services.'
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
              'Please fill in the information for at least one option to add to the giveaway default settings of this server.'
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
            `Please enter the blacklisted roles in the correct format.\n\nFor 1 role: Tag the role\nFor example - @role\n\nFor multiple roles: The first step is the same as for one role, you tag role 1. Then separate role 1 and role 2 with a comma and space repeat the first step for role 2, so on and so forth.\nFor example - @role1, @role2, @role3, …`
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
            `Please enter the bonus roles in the correct format.\n\nFor 1 role: Tag the role, hit spacebar, and state the number of entries.\nFor example - @role 5\n\nFor multiple roles: The first step is the same as for one role, you tag role 1, hit spacebar, and state the number of entries. Then separate role 1 and role 2 with a comma and space repeat the first step for role 2, so on and so forth.\nFor example - @role1 5, @role2 6, @role3 7, …`
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
            `Please enter the role requirements in the correct format.\n\nFor 1 role: Tag the role\nFor example - @role\n\nFor multiple roles: The first step is the same as for one role, you tag role 1. Then separate role 1 and role 2 with a comma and space repeat the first step for role 2, so on and so forth.\nFor example - @role1, @role2, @role3, …`
          );
        arr.reqRoles = reqRoles;
      }
      if (winnerRole) {
        const position = botRole.comparePositionTo(winnerRole);
        if (position < 0) {
          return interaction.editReply(
            'My bot role should be higher than the winner role to let me assign it to users. Please go to role settings and place my role above the winner role.'
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
                "Your default settings are saved. You will have the option to apply the default settings when you create a giveaway."
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
        .send(`${client.user.username} has trouble in defaults.js -\n\n${e}`);
    }
  },
};
