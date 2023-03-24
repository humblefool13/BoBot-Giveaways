const subs = require('../models/subscriptions.js');
const configs = require('../models/configurations.js');
module.exports = {
  name: 'add',
  async interact(client, interaction) {
    try {
      await interaction.deferReply();
      if (!interaction.member.roles.cache.has('969173759581904946'))
        return interaction.editReply({
          content:
            "This command isn't for you.\n\nOnly <@&969173759581904946> can use this command.",
          ephemeral: true,
        });
      const server = interaction.options.getString('server');
      const months = interaction.options.getInteger('months');
      const find_sub = await subs.findOne({
        server_id: server,
      });
      const find_config = await configs.findOne({
        server_id: server,
      });
      if (!find_sub && !find_config) {
        await new subs({
          server_id: server,
          start_timestamp: interaction.createdTimestamp,
          months: months,
          end_timestamp:
            interaction.createdTimestamp + months * 31 * 24 * 60 * 60 * 1000,
        })
          .save()
          .catch((e) => {
            console.log(e);
          });
        return interaction
          .editReply({
            content: `The server with server ID : ${server} has been successfully subscribed on <t:${parseInt(
              interaction.createdTimestamp / 1000
            )}:F> for ${months} months and the subscription will end on <t:${parseInt(
              (interaction.createdTimestamp +
                months * 31 * 24 * 60 * 60 * 1000) /
                1000
            )}:F>.`,
          })
          .catch((e) => {
            console.log(e);
          });
      } else if (find_sub) {
        const endTimestampOld = find_sub.end_timestamp;
        find_sub.end_timestamp =
          endTimestampOld + months * 31 * 24 * 60 * 60 * 1000;
        find_sub
          .save()
          .then(() => {
            return interaction
              .editReply({
                content: `The subscription for the server with server ID : ${server} which was supposed to end on <t:${parseInt(
                  endTimestampOld / 1000
                )}:F> is now extended to <t:${parseInt(
                  (endTimestampOld + months * 31 * 24 * 60 * 60 * 1000) / 1000
                )}:F>.`,
              })
              .catch((e) => {
                console.log(e);
              });
          })
          .catch((e) => {});
      } else if (!find_sub && find_config) {
        await new subs({
          server_id: server,
          start_timestamp: interaction.createdTimestamp,
          months: months,
          end_timestamp:
            interaction.createdTimestamp + months * 31 * 24 * 60 * 60 * 1000,
        })
          .save()
          .catch((e) => {
            console.log(e);
          });
        find_config.expired = false;
        find_config.expired_timestamp = 0;
        await find_config.save().catch((e) => {
          console.log(e);
        });
        return interaction
          .editReply({
            content: `The subscription for the server with server ID : ${server} which had expired, is renewed on <t:${parseInt(
              interaction.createdTimestamp / 1000
            )}:F> for ${months} months and the subscription will end on <t:${parseInt(
              (interaction.createdTimestamp +
                months * 31 * 24 * 60 * 60 * 1000) /
                1000
            )}:F>.`,
          })
          .catch((e) => {
            console.log(e);
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
        .send(`${client.user.username} has trouble in add.js -\n\n${e}`);
    }
  },
};
