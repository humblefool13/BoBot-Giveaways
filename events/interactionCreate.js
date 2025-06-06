const { InteractionType } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(client, interaction) {
    let Icommand = '';
    try {
      if (interaction.isChatInputCommand()) {
        Icommand = interaction.commandName;
      } else if (
        interaction.type === InteractionType.MessageComponent &&
        [
          'aptosWallet',
          'authorizeConnections',
          'check',
          'enter',
          'ethereumWallet',
          'exportA',
          'exportB',
          'exportC',
          'exportD',
          'multiversxWallet',
          'revokeConnections',
          'solanaWallet',
        ].includes(interaction.customId)
      ) {
        Icommand = interaction.customId;
      } else {
        return;
      }
      const command = client.interactions.get(Icommand);
      command.interact(client, interaction);
    } catch (e) {
      console.log(e);
      interaction
        .reply({
          content:
            'I am having some trouble, the developer has been informed. Please try again in a few hours.',
          ephemeral: true,
        })
        .then(() => {
          client.users.cache
            .get('727498137232736306')
            .send(
              `${client.user.username} has trouble in interactionCreate.js -\n\n${e}`
            );
        });
    }
  }, //execute
};
