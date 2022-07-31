const wallets = require("../models/wallets.js");
const subs = require("../models/subscriptions.js");
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const rownew = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Submit new wallet!")
      .setCustomId("submitmodal")
      .setStyle(ButtonStyle.Success),
  );
const rowchange = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Yes, change old wallet!")
      .setCustomId("submitmodal")
      .setStyle(ButtonStyle.Success),
  );

const modal = new ModalBuilder()
  .setTitle("Submit Wallet")
  .setCustomId("modal");

const question = new TextInputBuilder()
  .setCustomId('walletAddress')
  .setLabel("Please enter your wallet address below.")
  .setStyle(TextInputStyle.Short);

const firstActionRow = new ActionRowBuilder().addComponents(question);
modal.addComponents(firstActionRow);

module.exports = {
  name: "submit",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const sub = subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub) return interaction.editReply("The subscription for this server has expired, please renew at the [BoBot Labs Support Server](https://discord.gg/HweZtrzAnX) to continue using the services.");
      const find = await wallets.findOne({
        discord_id: interaction.user.id,
        server_id: interaction.guildId,
      });
      let sent, wallet;
      if (!find) {
        sent = await interaction.editReply({
          content: "You have not saved any wallet in this server previously. Click the button below to make your first submission. Please remember this wallet is automatically submitted for all WLs you win, so submitting a burner wallet is highly recommended. Please copy your wallet address now and paste it in the pop-up after clicking the button. You can use ENS name.",
          components: [rownew],
          fetchReply: true
        });
      } else {
        wallet = find.wallet;
        sent = await interaction.editReply({
          content: `You have saved the wallet:\n\n**${wallet}**\n\nin this server previously. Would you like to change it to some other wallet? If so, please copy your wallet address now and paste it in the pop-up after clicking the button else "Dismiss Message". You can use ENS name.`,
          components: [rowchange],
          fetchReply: true
        });
      };
      const filter = (int) => int.customId === 'submitmodal' && int.user.id === interaction.user.id;
      const collector = await sent.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000, max: 1 });
      collector.on(async (i) => {
        await i.showModal(modal);
        await i.deferUpdate();
        const modalfilter = (modi) => modi.customId === 'modal' && modi.user.id === interaction.user.id;
        const modalSubmit = await interaction.awaitModalSubmit({ modalfilter, time: 60000 });
        if (!modalSubmit) return i.update({
          content: `The wallet was not submitted within the time frame. Please "Dismiss Message" and start again.`,
          components: [],
        });
        const input = modalSubmit.fields.getTextInputValue('walletAddress');
        const walletNew = input.trim();
        if (walletNew.includes(" ")) return i.update({
          content: `Please enter a valid address. The currently entered one (**${walletNew}**) includes a space \` \`.\nIf you think this is a mistake please contact BoBot Labs.`,
          components: [],
        });
        let ens = false;
        if (walletNew.endsWith(".eth")) ens = true;
        if (!ens && (!walletNew.startsWith("0x") || !walletNew.length === 42)) return i.update({
          content: `Please enter a valid address. The currently entered one (**${walletNew}**) is invalid.`,
          components: [],
        });
        if (find) {
          find.wallet = walletNew;
          find.save().catch((e) => { console.log(e) });
        } else {
          await new wallets({
            discord_id: interaction.user.id,
            wallet: walletNew,
            server_id: interaction.guildId,
          }).save().catch((e) => { console.log(e) });
        };
        if (wallet) {
          return i.update({
            components: [],
            content: `Done! :white_check_mark:\nYour registered wallet address:\n**${wallet}**\n\nis changed to the new wallet address:\n**${walletNew}**.`,
          });
        } else {
          return i.update({
            components: [],
            content: `Congratulations! :tada:\nYou just registered your first wallet address for this server:\n**${walletNew}**. This will be automatically submitted when you win any giveaway!`,
          });
        };
      });
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