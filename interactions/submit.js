const wallets = require("../models/wallets.js");
const subs = require("../models/subscriptions.js");
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
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
  .setTitle("Submit Wallet Address")
  .setCustomId("modal");
const question = new TextInputBuilder()
  .setCustomId('walletAddress')
  .setLabel("Please enter your wallet address below.")
  .setStyle(TextInputStyle.Short);
const firstActionRow = new ActionRowBuilder().addComponents(question);
modal.addComponents(firstActionRow);
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder()
    .setColor("#35FF6E")
    .setDescription(des)
    .setFooter({ text: "Powered by bobotlabs.xyz", iconURL: "https://cdn.discordapp.com/attachments/1003741555993100378/1003742971000266752/gif.gif" });
  return embed;
};

module.exports = {
  name: "submit",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const sub = subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub) return interaction.editReply({ embeds: [MakeEmbedDes("The subscription for this server has expired, please renew at the [BoBot Labs Support Server](https://discord.gg/HweZtrzAnX) to continue using the services.")] });
      const find = await wallets.findOne({
        discord_id: interaction.user.id,
        server_id: interaction.guildId,
      });
      let sent, wallet;
      if (!find) {
        sent = await interaction.editReply({
          embeds: [MakeEmbedDes("You have not saved any wallet in this server previously. Click the button below to make your first submission. Please remember this wallet is automatically submitted for all WLs you win, so submitting a burner wallet is highly recommended. Please copy your wallet address now and paste it in the pop-up after clicking the button.")],
          components: [rownew],
          fetchReply: true
        });
      } else {
        wallet = find.wallet;
        sent = await interaction.editReply({
          embeds: [MakeEmbedDes(`You have saved the wallet address:\n\n**${wallet}**\n\nin this server previously. Would you like to change it to some other wallet? If so, please copy your wallet address now and paste it in the pop-up after clicking the button below else "Dismiss Message".`)],
          components: [rowchange],
          fetchReply: true
        });
      };
      const filter = (int) => int.customId === 'submitmodal' && int.user.id === interaction.user.id;
      const collector = await sent.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000, max: 1 });
      collector.on("collect", async (i) => {
        await i.showModal(modal);
        const modalfilter = (modi) => modi.customId === 'modal' && modi.user.id === interaction.user.id;
        const modalSubmit = await i.awaitModalSubmit({ filter: modalfilter, time: 60000 }).catch((e) => { });
        if (!modalSubmit) return i.editReply({
          embeds: [MakeEmbedDes(`The wallet was not submitted within the time frame. Please "Dismiss Message" and start again.`)],
          components: [],
        });
        modalSubmit.deferUpdate();
        const input = modalSubmit.fields.getTextInputValue('walletAddress');
        const walletNew = input.trim();
        if (walletNew.includes(" ")) return i.editReply({
          embeds: [MakeEmbedDes(`Please enter a valid address. The currently entered one (**${walletNew}**) includes a space \` \`.`)],
          components: [],
        });
        let ens = false;
        if (walletNew.toLowerCase().endsWith(".eth")) ens = true;
        if (!ens && (!walletNew.startsWith("0x") || walletNew.length !== 42)) return i.editReply({
          embeds: [MakeEmbedDes(`Please enter a valid address. The currently entered one (**${walletNew}**) is invalid.`)],
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
          return i.editReply({
            components: [],
            embeds: [MakeEmbedDes(`Done! :white_check_mark:\nYour previously registered wallet address:\n**${wallet}**\n\nis changed to the new wallet address:\n**${walletNew}**.`)],
          });
        } else {
          return i.editReply({
            components: [],
            embeds: [MakeEmbedDes(`Congratulations! :tada:\nYou just registered your first wallet address for this server:\n**${walletNew}**.\nThis will be automatically submitted when you win any giveaway!`)],
          });
        };
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
      client.users.cache.get("727498137232736306").send(`${client.user.username} has trouble in submit.js -\n\n${e}`);
    };
  }
}