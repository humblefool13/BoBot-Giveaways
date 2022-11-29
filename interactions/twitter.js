const twitter_db = require("../models/twitter.js");
const subs = require("../models/subscriptions.js");
const fetch = require("node-fetch");
const authRequest = require("twitter-v1-oauth").default;
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const rowFirst = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Please Wait!")
      .setEmoji("973124874124005396")
      .setCustomId("loadingButton")
      .setDisabled(true)
      .setStyle(ButtonStyle.Primary),
  );
const oAuthOptions = {
  api_key: process.env.TWITTER_API_KEY,
  api_secret_key: process.env.TWITTER_API_SECRET_KEY,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
};
function rowBuilder(link) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel("Verify")
        .setEmoji("✅")
        .setCustomId("verifyButton")
        .setURL(link)
        .setStyle(ButtonStyle.Link),
    );
  return row;
};
const modal = new ModalBuilder()
  .setTitle("Twitter Verification")
  .setCustomId("modalT");
const question = new TextInputBuilder()
  .setCustomId('twitterCode')
  .setLabel("Please enter the 7 digit code here!")
  .setPlaceholder('1234567')
  .setStyle(TextInputStyle.Short);
const firstActionRow = new ActionRowBuilder().addComponents(question);
modal.addComponents(firstActionRow);

module.exports = {
  name: "twitterv",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const sub = subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub) return interaction.editReply({ embeds: [MakeEmbedDes("The subscription for this server has expired, please renew at the [BoBot Labs Support Server](https://discord.gg/HweZtrzAnX) to continue using the services.")] });
      const find = await twitter_db.findOne({
        discord_id: interaction.user.id,
      });
      let sent;
      if (find) {
        sent = await interaction.editReply({
          content: 'You have already connected your twitter account. You do not need to do it twice!\n\nDo you need to change it?\n\nOn successful verification you will get a code which you would have to paste here.\n\nIt\'s a one time process.',
          components: [rowFirst],
          fetchReply: true
        });
      } else {
        sent = await interaction.editReply({
          content: 'Click the button below to connect your twitter account! This is a one-time process!\n\nOn successful verification you will get a code which you would have to paste here.',
          components: [rowFirst],
          fetchReply: true
        });
      };
      const urlStep1 = "https://api.twitter.com/oauth/request_token?oauth_callback=oob";
      const method = "POST";
      const params = { q: "twitter bot" };
      const authorization = authRequest({ method, urlStep1, params }, oAuthOptions);
      const response = await fetch(urlStep1, {
        method: "POST",
        headers: {
          "Authorization": authorization,
        }
      });
      if (response.status !== 200) return interaction.editReply({
        content: "Something went wrong. Please try again later."
      });
      const result = await response.json();
      if (!result.oauth_callback_confirmed) return interaction.editReply({
        content: "Something went wrong. Please try again later."
      });
      const urlStep2 = `https://api.twitter.com/oauth/authorize?oauth_token=${result.oauth_token}`;
      sent = await interaction.editReply({
        content: "Please click the button below to verify.",
        components: [rowBuilder(urlStep2)],
        fetchReply: true
      });
      const filter = (interactionCreated) => interactionCreated.customId === 'verifyButton' && interactionCreated.user.id === interaction.user.id;
      const collector = await sent.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 * 5, max: 1 });
      collector.on('collect', async (i) => {
        await i.showModal(modal);
        const modalfilter = (modi) => modi.customId === 'modalT' && modi.user.id === interaction.user.id;
        const modalSubmit = await i.awaitModalSubmit({ filter: modalfilter, time: 60000 * 5 }).catch((e) => { });
        if (!modalSubmit) return i.editReply({
          content: `The code was not submitted within the time frame. Please "Dismiss Message" and start again.`,
          components: [],
        });
      });
      modalSubmit.deferUpdate();
      let code = modalSubmit.fields.getTextInputValue('twitterCode');
      code = code.trim();
      const urlStep3 = `https://api.twitter.com/oauth/access_token?oauth_verifier=${code}&oauth_token=${result.oauth_token}`;
      const responseStep3 = await fetch(urlStep3, {
        method: "POST",
      });
      const resultStep3 = await responseStep3.json();
      if (!resultStep3.screen_name) {
        return interaction.editReply({
          components: [],
          content: `Verification Failed.\n\nPlease try again sometime later.`,
        });
      } else {
        await twitter_db.deleteMany({
          discord_id: interaction.user.id,
        }).catch();
        await new twitter_db({
          discord_id: interaction.user.id,
          outh_token: resultStep3.oauth_token,
          outh_token_secret: resultStep3.oauth_token_secret,
          screen_name: resultStep3.screen_name,
          twitter_id: resultStep3.user_id,
        }).save().catch((e) => console.log(e));
        return interaction.editReply({
          content: `Verification Successful!\n\nTwitter Username: **${resultStep3.screen_name}**.`,
        });
      };
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
      client.users.cache.get("727498137232736306").send(`${client.user.username} has trouble in twitter.js -\n\n${e}`);
    };
  }
};