const wallets = require('../models/wallets.js');
const subs = require('../models/subscriptions.js');
const { TxnBuilderTypes } = require('aptos');
const AccountAddress = TxnBuilderTypes.AccountAddress;
const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} = require('discord.js');
const rownew = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Submit new Aptos wallet!')
    .setCustomId('submitmodal')
    .setStyle(ButtonStyle.Success)
);
const rowchange = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Yes, change Aptos wallet!')
    .setCustomId('submitmodal')
    .setStyle(ButtonStyle.Success)
);
const rowGlobal = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Make this my global Aptos wallet!')
    .setEmoji('✅')
    .setCustomId('globalyes')
    .setStyle(ButtonStyle.Primary)
);
const rowGlobalDis = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Make this my global Aptos wallet!')
    .setEmoji('✅')
    .setDisabled(true)
    .setCustomId('globalyes')
    .setStyle(ButtonStyle.Primary)
);
function MakeEmbedDes(des) {
  const embed = new EmbedBuilder().setColor('#35FF6E').setDescription(des);
  return embed;
}

module.exports = {
  name: 'aptosWallet',
  async interact(client, interaction) {
    const modal = new ModalBuilder()
      .setTitle('Submit Aptos Wallet Address')
      .setCustomId('modal');
    const question = new TextInputBuilder()
      .setCustomId('walletAddress')
      .setLabel('Enter your Aptos wallet address below.')
      .setStyle(TextInputStyle.Short);
    const firstActionRow = new ActionRowBuilder().addComponents(question);
    modal.addComponents(firstActionRow);
    try {
      await interaction.deferReply({ ephemeral: true });
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
      const find = await wallets.findOne({
        discord_id: interaction.user.id,
      });
      let sent,
        wallet = 'Not Saved Yet.',
        globalWallet = 'Not Saved Yet.',
        savedWallets;
      if (!find) {
        sent = await interaction.editReply({
          embeds: [
            MakeEmbedDes(
              'You have not saved any Aptos wallet on this server, nor have you saved a global Aptos wallet. Please click the “Submit new Aptos wallet!” button below, copy and paste your wallet address in the pop-up to submit your wallet. Please remember that this wallet address will be automatically recorded when you win WL spots, so we highly recommend you submit a burner wallet.'
            ),
          ],
          components: [rownew],
          fetchReply: true,
        });
        question.setPlaceholder('0x.........');
      } else {
        globalWallet = find.wallet_global_apt;
        savedWallets = find.wallets_apt;
        savedWallets.forEach((walletLol) => {
          if (walletLol[0] !== interaction.guild.id) return;
          wallet = walletLol[1];
        });
        sent = await interaction.editReply({
          embeds: [
            MakeEmbedDes(
              `You have saved the following Aptos wallet addresses:\n\nServer Aptos Wallet: **${wallet}**\nGlobal Aptos Wallet: **${
                globalWallet ? globalWallet : 'Not Saved Yet.'
              }**\n\nWould you like to change your wallet addresses? If so, please click the “Yes, change my Aptos wallet!” copy and paste your new wallet address in the pop-up to submit your new wallet address. If you do not need to change your wallet addresses, please click “Dismiss message” at the bottom of the message.`
            ),
          ],
          components: [rowchange],
          fetchReply: true,
        });
        if (globalWallet?.startsWith('0x')) {
          question.setPlaceholder(globalWallet);
        } else {
          question.setPlaceholder('0x.........');
        }
      }
      const filter = (int) =>
        int.customId === 'submitmodal' && int.user.id === interaction.user.id;
      const collector = await sent.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 60000,
        max: 1,
      });
      collector.on('collect', async (i) => {
        await i.showModal(modal);
        const modalfilter = (modi) =>
          (modi.customId = 'modal' && modi.user.id === interaction.user.id);
        const modalSubmit = await i
          .awaitModalSubmit({ filter: modalfilter, time: 60000 })
          .catch((e) => {});
        if (!modalSubmit)
          return i.editReply({
            embeds: [
              MakeEmbedDes(
                `The wallet was not submitted within the time frame. Please "Dismiss Message" and start again.`
              ),
            ],
            components: [],
          });
        modalSubmit.deferUpdate();
        const input = modalSubmit.fields.getTextInputValue('walletAddress');
        const walletNew = input.trim();
        if (walletNew.includes(' '))
          return i.editReply({
            embeds: [
              MakeEmbedDes(
                `Please enter a valid Aptos address. The currently entered one ( **${walletNew}** ) includes a space \` \`.`
              ),
            ],
            components: [],
          });
        try {
          const validity = AccountAddress.isValid(walletNew);
        } catch (e) {
          return i.editReply({
            embeds: [
              MakeEmbedDes(
                `Please enter a valid Aptos address. The currently entered one ( **${walletNew}** ) is invalid.`
              ),
            ],
            components: [],
          });
        }
        let sentv2;
        if (!find) {
          await new wallets({
            discord_id: interaction.user.id,
            wallet_global_apt: 'Not Submitted Yet.',
            wallets_apt: [[interaction.guild.id, walletNew]],
          })
            .save()
            .catch((e) => {});
        } else {
          if (wallet === 'Not Saved Yet.') {
            savedWallets.push([interaction.guild.id, walletNew]);
          } else {
            const findWalletIndex = savedWallets.find(
              (el) => el[0] === interaction.guild.id
            );
            const index = savedWallets.indexOf(findWalletIndex);
            savedWallets[index] = [interaction.guild.id, walletNew];
          }
          find.wallets_apt = savedWallets;
          await find.save().catch((e) => {
            console.log(e);
          });
        }
        if (wallet === 'Not Saved Yet.') {
          sentv2 = await interaction.editReply({
            embeds: [
              MakeEmbedDes(
                `You just saved your Aptos wallet address for this server!\nEverytime you win an Aptos WL giveaway, this wallet will be automatically recorded!\n\nPlease also consider setting it as global Aptos wallet if not done so yet:\nA global wallet is the wallet address that the bot will remember for all discord servers that use SnapBot. The advantage of saving a wallet address as a global wallet is that you will not have to submit your wallet again in all discord servers that use SnapBot. SnapBot will use your global wallet in those servers **UNLESS** you specifically set a server wallet for a particular discord server.\n\nIf you do not need to set your global wallet, please click “Dismiss message” at the bottom of the message.`
              ),
            ],
            components: [rowGlobal],
          });
        } else {
          sentv2 = await interaction.editReply({
            embeds: [
              MakeEmbedDes(
                `You have successfully changed your Aptos wallet address for this server!\n\n**Removed: ${wallet}\nNew: ${walletNew}**\n\nEverytime you win an Aptos WL giveaway, this wallet will be automatically recorded!\n\nPlease also consider setting it as global Aptos wallet if not done so yet:\nA global wallet is the wallet address that the bot will remember for all discord servers that use SnapBot. The advantage of saving a wallet address as a global wallet is that you will not have to submit your wallet again in all discord servers that use SnapBot. SnapBot will use your global wallet in those servers **UNLESS** you specifically set a server wallet for a particular discord server.\n\nIf you do not need to set your global wallet, please click “Dismiss message” at the bottom of the message.`
              ),
            ],
            components: [rowGlobal],
          });
        }
        const globalFilter = (int) =>
          int.user.id === interaction.user.id && int.customId === 'globalyes';
        const globalcollector = await sentv2.createMessageComponentCollector({
          filter: globalFilter,
          componentType: ComponentType.Button,
          time: 60000,
          max: 1,
        });
        globalcollector.on('collect', async (i) => {
          const findNew = await wallets.findOne({
            discord_id: interaction.user.id,
          });
          findNew.wallet_global_apt = walletNew;
          await findNew.save().catch((e) => {});
          await i.update({
            components: [rowGlobalDis],
            embeds: [
              MakeEmbedDes(
                `Global Aptos wallet address:\n\n**${walletNew}**\n\nThis is now set as your global Aptos wallet and will be used for all discord servers that use SnapBot **UNLESS** you specifically set a server wallet for a particular discord server.`
              ),
            ],
          });
        });
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
        .send(`${client.user.username} has trouble in submit.js -\n\n${e}`);
    }
  },
};
