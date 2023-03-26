const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType
} = require('discord.js');

module.exports = {
  name: 'help',
  async interact(client, interaction) {
    try {
      const giveawayCommandCompulsory = new EmbedBuilder()
        .setTitle("SnapBot Help")
        .setColor("#35FF6E")
        .setDescription("1) \`/giveaway\` - \nI) Compulsory Inputs:\n\n1)Prize: Enter a prize name\n2) Winners: Enter the number of winners\n3) Duration: Enter the duration of the giveaway in this format- xdays xhours xminutes. For example, 7d 2h 10m, the giveaway will end in 7 days 2 hours and ten minutes.\n4) Wallet Requirement: Do your community members need to have submitted their wallet addresses to enter this giveaway? If yes, please select True. If no, please select False.\n5) Blockchain: Select the blockchain of the project for this giveaway. You can choose from Ethereum, Solana, Aptos or MultiversX.\n6) Type: Select the type of whitelist spot for this giveaway. You can choose from DTC (Direct To Contract), Role (Discord Role on Project's Server), DTC-FCFS (Direct To Contract but First Come First Served), and Role-FCFS (Discord Role on Project's Server but First Come First Served).");
      const giveawayCommandOptional = new EmbedBuilder()
        .setTitle("SnapBot Help")
        .setColor("#35FF6E")
        .setDescription("II) Optional Inputs:\n\n1) Description: Enter the description of the giveaway/project. Limited to 3000 characters.\n2) Attach-picture: Attach a picture for the giveaway post. Drag and drop or click to upload the image file.\n3) Ping-message: Enter a message to ping specific roles to alert your community that this giveaway has started. For example, \'A new giveaway has started! @everyone\'\n4) Mint-price-public: Enter the mint price of the public sale for the project, and include the blockchain. For example: 0.3 ETH\n5) Mint-price-presale: Enter the mint price of the presale for the project and include the blockchain. For example: 0.15 ETH\n6) Mint-date: Enter the mint date and time in the timezone you set during setup using this format, Day/ Date/ Time(24h). For example: 30 June 20:00, the mint date is on 30/06/2023, 8 p.m. You must input this information if you want mint reminders to be sent to your community in reminders channel.\n7) Roles-req: The roles required to enter this giveaway. Community members without the mentioned role(s) will be denied to enter this giveaway. Enter this information in this format: @role1, @role2, @role3…\n8) Bonus-entries: Bonus entries for specific roles. Community members with a bonus entry role will have multiple entries for this giveaway. Enter this information in this format, @role1 X, role2 Y. For example: @roles1 5, @role2 10… @role1 will have 5 entries to this giveaway, @role2 will have 10 entries to this giveaway.\n9) Blacklist-roles: The roles banned from entering this giveaway. Community members with the mentioned role(s) will be denied to enter this giveaway. Enter this information in this format: @role1, @role2, @role3…\n10) Winner-role-add: This adds a role to giveaway winners. Enter this information in this format: @nameofwinnerrole\n11) Socials-Twitter: This will display the project's Twitter link in an embedded format. Enter the full link of the project\'s Twitter.\n12) Socials-Discord: This will display the project\'s Discord link in an embedded format. Enter the full link of the project\'s Discord.\n13) Follow-twit-req: This will add a giveaway requirement for your community members to join a specific Twitter account(s). Enter the full link of the Twitter account. If there are multiple Twitter accounts, they should be separated by a comma and space (, ), for example: https://twitter.com/X, https://twitter.com/Y, https://twitter.com/Z\n14) Like-rt-twit-req: This will add a giveaway requirement for your community members to like and retweet a specific Twitter post. Enter the full link of the Tweet.\n15) Discord-member-req: This will add a giveaway requirement for your community members to join a Discord server. Enter the full Discord invite link to the Discord server. The Discord invite link must not expire before the end of the giveaway.\n16) Minimum-balance: This will add a giveaway requirement for your community members to have a minimum balance of X ETH in their wallets joining this giveaway. This is only available for the Ethereum blockchain. Enter a numerical value, for example: 0.3");
      const defaultSettings = new EmbedBuilder()
        .setTitle("SnapBot Help")
        .setColor("#35FF6E")
        .setDescription("2) \`/default-settings\`\n\nYou will be able to enter default settings for 6 optional inputs:\nI) Ping Message\nII) Role Requirement\nIII) Bonus Entries\nIV) Blacklisted Roles\nV) Winner Role\nVI) Minimum ETH Balance\n\nOnce you have added these default settings, you no longer have to input these options when creating a new giveaway. Instead, there will be an option for you to apply the default settings at the final step of creating a giveaway.");
      const setupCommand = new EmbedBuilder()
        .setTitle("SnapBot Help")
        .setColor("#35FF6E")
        .setDescription("3) \`/setup\`\n\nIf you have already set up SnapBot and you are happy with everything, **do not use this command again.** Only perform this command if you have accidentally deleted any of the SnapBot giveaway channels or the Giveaway Manager role. By performing this command, you will set up brand new giveaway channels and a new giveaway manager role that needs to be reconfigured, and your community members have to resubmit all their information in the new submit-info channel.");
      const helpCommand = new EmbedBuilder()
        .setTitle("SnapBot Help")
        .setColor("#35FF6E")
        .setDescription("4) \`/help\`\n\nUse this command when you need detailed instructions for using SnapBot.");
      const row_left = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("left")
            .setLabel("❰")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("right")
            .setLabel("❱")
            .setStyle(ButtonStyle.Primary)
        );
      const row_middle = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("left")
            .setLabel("❰")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("right")
            .setLabel("❱")
            .setStyle(ButtonStyle.Primary)
        );
      const row_right = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("left")
            .setLabel("❰")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("right")
            .setLabel("❱")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );
      const dead_buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("left")
            .setLabel("❰")
            .setDisabled(true)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("right")
            .setLabel("❱")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );
      let counter = 0;
      const sent = await interaction.reply({
        embeds: [giveawayCommandCompulsory, giveawayCommandOptional],
        ephemeral: true,
        components: [row_left],
        fetchReply: true,
      });
      const collector = sent.createMessageComponentCollector({
        componentType: ComponentType.Button,
        idle: 5 * 60 * 1000,
      });
      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: "These buttons aren't for you.",
            ephemeral: true,
          });
        };
        await i.deferUpdate();
        if (counter === 0) {
          await interaction.editReply({
            embeds: [defaultSettings],
            ephemeral: true,
            components: [row_middle],
          });
          ++counter;
          return;
        } else if (counter === 1) {
          if (i.customId === "left") {
            await interaction.editReply({
              embeds: [giveawayCommandCompulsory, giveawayCommandOptional],
              ephemeral: true,
              components: [row_left],
            });
            --counter;
            return;
          } else if (i.customId === "right") {
            await interaction.editReply({
              embeds: [setupCommand],
              ephemeral: true,
              components: [row_middle],
            });
            ++counter;
            return;
          };
        } else if (counter === 2) {
          if (i.customId === "left") {
            await interaction.editReply({
              embeds: [defaultSettings],
              ephemeral: true,
              components: [row_middle],
            });
            --counter;
            return;
          } else if (i.customId === "right") {
            await interaction.editReply({
              embeds: [helpCommand],
              ephemeral: true,
              components: [row_right],
            });
            ++counter;
            return;
          };
        } else if (counter === 3) {
          await interaction.editReply({
            embeds: [setupCommand],
            ephemeral: true,
            components: [row_middle],
          });
          --counter;
          return;
        };
      });
      collector.on("end", async (collected) => {
        await interaction.editReply({
          ephemeral: true,
          components: [dead_buttons],
        }).catch((e) => { });
        return;
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
        .send(`${client.user.username} has trouble in help.js -\n\n${e}`);
    }
  },
};