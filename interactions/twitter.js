const twitter_db = require("../models/twitter.js");
const subs = require("../models/subscriptions.js");
const fetch = require("node-fetch");
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const rowFirst = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("New Twitter Account!")
      .setCustomId("verifymodal")
      .setURL("https://twitter.com/i/oauth2/authorize?response_type=code&client_id=c0NySEZpU19vSWY4bFJYMndLMGg6MTpjaQ&redirect_uri=https://twitter.humblefool13.repl.co&scope=tweet.read%20like.read%20users.read%20follows.read%20offline.access&state=state&code_challenge=challenge&code_challenge_method=plain")
      .setStyle(ButtonStyle.Link),
  );
/*const rownew = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Verify Twitter Account!")
      .setCustomId("verifymodal")
      .setStyle(ButtonStyle.Success),
  );
const rowchange = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setLabel("Yes, change old twitter!")
      .setCustomId("verifymodal")
      .setStyle(ButtonStyle.Success),
  );
const modal = new ModalBuilder()
  .setTitle("BoBot Twitter Verification")
  .setCustomId("modalT");
const question = new TextInputBuilder()
  .setCustomId('twitterUsername')
  .setLabel("Please enter your twitter username below.")
  .setPlaceholder('@UsErNaMe_xYz123_234/*')
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
function genHexString(len) {
  const str = Math.floor(Math.random() * Math.pow(16, len)).toString(16);
  return ("0".repeat(len - str.length) + str).toLowerCase();
};
async function getTwitterData(username, hex) {
  const url = `https://api.twitter.com/2/users/by/username/${username}?user.fields=description,name,profile_image_url`;
  let result, response, retry = 0;
  do {
    ++retry;
    result = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${process.env["bearer_token"]}`,
      }
    });
    response = await result.json();
  } while (!response?.data?.id && retry < 50);
  if (!response?.data) return "FAILED";
  const data = response.data;
  if (data.description.toLowerCase().includes(`bobot-${hex}`)) {
    return [true, data];
  } else {
    return [false];
  }
};*/

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
          content: 'You have already connected your twitter account. You do not need to do it twice!\n\nDo you need to change it?',
          components: [rowFirst],
          fetchReply: true
        });
      } else {
        sent = await interaction.editReply({
          content: 'Click the button below to connect your twitter account! This is a one-time process!',
          components: [rowFirst],
          fetchReply: true
        });
      };
      /*
      let sent;
      const hex = genHexString(6);
      if (!find) {
        sent = await interaction.editReply({
          embeds: [MakeEmbedDes(`You have not verified your twitter account previously.\nThis is a quick one time process and will verify you for all discord servers and giveaways this bot is used for!\n\nPlease add this to your twitter bio-\n\n**bobot-${hex}**\n\nAfter done please click the button below and you will be asked to enter your twitter @UsErNaMe@123.\n**NOTE**: Usernames are case sensitive.`)],
          components: [rownew],
          fetchReply: true
        });
      } else {
        account = find.t_username;
        sent = await interaction.editReply({
          embeds: [MakeEmbedDes(`You have already verified this account to be yours-\n\n[@${account}](<https://twitter.com/${account}>)\n\nIf you want to change it, please add the following text in your new twitter account bio-\n\n**bobot-${hex}**\n\nAfter done please click the button below and you will be asked to enter your twitter @UsErNaMe@123.\n**NOTE**: Usernames are case sensitive.`)],
          components: [rowchange],
          fetchReply: true
        });
      };
      const filter = (interactionCreated) => interactionCreated.customId === 'verifymodal' && interactionCreated.user.id === interaction.user.id;
      const collector = await sent.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 * 5, max: 1 });
      collector.on("collect", async (i) => {
        await i.showModal(modal);
        const modalfilter = (modi) => modi.customId === 'modalT' && modi.user.id === interaction.user.id;
        const modalSubmit = await i.awaitModalSubmit({ filter: modalfilter, time: 60000 * 5 }).catch((e) => { });
        if (!modalSubmit) return i.editReply({
          embeds: [MakeEmbedDes(`The username was not submitted within the time frame. Please "Dismiss Message" and start again.`)],
          components: [],
        });
      });
      modalSubmit.deferUpdate();
      const input = modalSubmit.fields.getTextInputValue('twitterUsername');
      const username = input.trim().replace("@", "");
      const t_data = await getTwitterData(username, hex);
      if (t_data === "FAILED") return i.editReply({
        components: [],
        embeds: [MakeEmbedDes(`Oops! Something went wrong.\nPlease try again in sometime.`)],
      });
      if (t_data[0]) {
        const data = t_data[1];
        await new twitter_db({
          discord_id: interaction.user.id,
          twitter_id: data.id,
          t_username: data.username,
        }).save().catch((e) => console.log(e));
        return i.editReply({
          components: [],
          embeds: [MakeEmbedDes(`Verification Successful!\n\nName: ${data.name}\nUsername: ${data.username}\nBio: ${data.description}\n\nNow you may remove the \`bobot-${hex}\` from your bio and your account is saved for all servers and all present/future giveaways!`).setThumbnail(data.profile_image_url)],
        });
      } else {
        return i.editReply({
          components: [],
          embeds: [MakeEmbedDes(`Verification Failed.\nReason: The string \`bobot-${hex}\` was not found in the bio.`)],
        });
      };*/
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