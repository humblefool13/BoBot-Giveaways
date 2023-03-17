const wallets = require('../models/wallets.js');
const subs = require('../models/subscriptions.js');
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
    .setLabel('Submit new Ethereum wallet!')
    .setCustomId('submitmodal')
    .setStyle(ButtonStyle.Success)
);
const rowchange = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Yes, change Ethereum wallet!')
    .setCustomId('submitmodal')
    .setStyle(ButtonStyle.Success)
);
const rowGlobal = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Make this my global Ethereum wallet!')
    .setEmoji('✅')
    .setCustomId('globalyes')
    .setStyle(ButtonStyle.Primary)
);
const rowGlobalDis = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Make this my global Ethereum wallet!')
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
  name: 'ethereumWallet',
  async interact(client, interaction) {
    const modal = new ModalBuilder()
      .setTitle('Submit Ethereum Wallet Address')
      .setCustomId('modal');
    const question = new TextInputBuilder()
      .setCustomId('walletAddress')
      .setLabel('Enter your ETH wallet address below.')
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
              'The subscription for this server has expired, please contact ST6 to continue using the services.'
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
              'You have not saved any ETH wallet in this server previously ( and neither have a global ETH wallet saved ). Click the button below to make your first submission. Please remember this wallet is automatically submitted for all WLs you win, so submitting a burner wallet is highly recommended. Please copy your wallet address now and paste it in the pop-up after clicking the button.'
            ),
          ],
          components: [rownew],
          fetchReply: true,
        });
        question.setPlaceholder('0x.........');
      } else {
        globalWallet = find.wallet_global_eth;
        savedWallets = find.wallets_eth;
        savedWallets.forEach((walletLol) => {
          if (walletLol[0] !== interaction.guild.id) return;
          wallet = walletLol[1];
        });
        sent = await interaction.editReply({
          embeds: [
            MakeEmbedDes(
              `You have saved the following Ethereum wallet addresses:\n\nServer Ethereum Wallet: **${wallet}**\nGlobal Ethereum Wallet: **${
                globalWallet ? globalWallet : 'Not Saved Yet.'
              }**\n\nWould you like to change the wallets or want to save a new server wallet? If so, please copy your wallet address now and paste it in the pop-up after clicking the button below else "Dismiss Message".`
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
                `Please enter a valid Ethereum address. The currently entered one ( **${walletNew}** ) includes a space \` \`.`
              ),
            ],
            components: [],
          });
        let ens = false;
        if (walletNew.toLowerCase().endsWith('.eth')) ens = true;
        if (!ens && (!walletNew.startsWith('0x') || walletNew.length !== 42))
          return i.editReply({
            embeds: [
              MakeEmbedDes(
                `Please enter a valid Ethereum address. The currently entered one ( **${walletNew}** ) is invalid.`
              ),
            ],
            components: [],
          });
        let sentv2;
        if (!find) {
          await new wallets({
            discord_id: interaction.user.id,
            wallet_global_eth: 'Not Submitted Yet.',
            wallets_eth: [[interaction.guild.id, walletNew]],
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
          find.wallets_eth = savedWallets;
          await find.save().catch((e) => {
            console.log(e);
          });
        }
        if (wallet === 'Not Saved Yet.') {
          sentv2 = await interaction.editReply({
            embeds: [
              MakeEmbedDes(
                `:tada: Congratulations! You just saved your Ethereum wallet address for this server!\nEverytime you win a Ethereum WL giveaway, this wallet will be automatically submitted to the team!\n\nAlso consider setting it as global Ethereum wallet if not done yet.\nA global wallet is the wallet address that the bot will remember for all discord servers this bot is used for giveaways in. Advantage of saving a wallet as global wallet address is that you won't have to save wallet address in all discord servers. The global one will automatically be used everywhere UNLESS you specifically save a wallet in a discord server.`
              ),
            ],
            components: [rowGlobal],
          });
        } else {
          sentv2 = await interaction.editReply({
            embeds: [
              MakeEmbedDes(
                `:tada: Congratulations! You just changed your Ethereum wallet address for this server!\n\nFrom: **${wallet}**\nTo: **${walletNew}**\n\nEverytime you win a Ethereum WL giveaway, this wallet will be automatically submitted to the team!\n\nAlso consider setting it as global Ethereum wallet if not done yet.\nA global wallet is the wallet address that the bot will remember for all discord servers this bot is used for giveaways in. Advantage of saving a wallet as global wallet address is that you won't have to save wallet address in all discord servers. The global one will automatically be used everywhere UNLESS you specifically save a wallet in a discord server.`
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
          findNew.wallet_global_eth = walletNew;
          await findNew.save().catch((e) => {});
          await i.update({
            components: [rowGlobalDis],
            embeds: [
              MakeEmbedDes(
                `The Ethereum wallet address\n\n**${walletNew}**\n\nis now set as your global Ethereum wallet and will be automatically used in all discord servers unless you save a new wallet in a specific server.`
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
        .send(`${client.user.username} has trouble in submit.js -\n\n${e}`);
    }
  },
};
