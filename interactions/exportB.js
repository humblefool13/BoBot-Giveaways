const subs = require("../models/subscriptions");
const winnersdb = require("../models/winners.js");
const exceljs = require('exceljs');

module.exports = {
  name: "exportB",
  async interact(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const sub = await subs.findOne({
        server_id: interaction.guildId,
      });
      if (!sub) return interaction.editReply({ embeds: [MakeEmbedDes("The subscription for this server has expired, please contact ST6 to continue using the services.")] });
      const exportID = interaction.message.embeds[0].footer.text;
      const winnersData = await winnersdb.findOne({
        exportID: exportID,
      });
      if (!winnersData) return interaction.editReply("Winners data is not available anymore.");
      const workbook = new exceljs.Workbook();
      workbook.creator = 'ST6 Giveaways Bot';
      const guild = client.guilds.cache.get(winnersData.guild_id);
      const worksheet = workbook.addWorksheet('Winners\' Data');
      worksheet.addRow(['Server Name:', guild.name]);
      worksheet.addRow(['Prize:', winnersData.prize_name]);
      worksheet.addRow(['Entries:', winnersData.entries]);
      worksheet.addRow(['Wallet Address', 'Discord User Tag']);
      winnersData.winnersData.forEach((tagsArray) => {
        const walletAddress = tagsArray[0];
        const userTag = tagsArray[1];
        worksheet.addRow([walletAddress, userTag]);
      });
      worksheet.columns[0].width = 65;
      worksheet.columns[1].width = 35;
      worksheet.eachRow(function (row, rowNumber) {
        row.eachCell((cell, colNumber) => {
          if (rowNumber < 4) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'ff91d2ff' }
            };
          } else if (rowNumber == 4) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'ff3dd219' }
            };
          } else if (rowNumber > 4 && rowNumber % 2 == 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'ffa4ffa4' }
            };
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        row.commit();
      });
      const bufferFile = await workbook.xlsx.writeBuffer();
      await interaction.editReply({
        content: `Below is the file attached which contains wallet addresses and discord user tags of ${winnersData.prize_name} winners.`,
        files: [{
          attachment: bufferFile,
          name: `${winnersData.prize_name}_${guild.name.replaceAll(" ", "")}_2.xlsx`
        }],
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
      client.users.cache.get("727498137232736306").send(`${client.user.username} has trouble in exportB.js -\n\n${e}`);
    };
  }
};