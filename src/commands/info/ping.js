const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Checks bot responsiveness and Discord API latency"),
  async execute(interaction, client) {
    const sent = await interaction.reply({ content: "Pinging...", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(config.theme.primaryColor)
      .setTitle("🏓 Pong!")
      .addFields(
        { name: "Bot Latency", value: `\`${latency} ms\``, inline: true },
        { name: "Discord API", value: `\`${apiLatency} ms\``, inline: true }
      )
      .setFooter({ text: config.theme.footerText });

    await interaction.editReply({ content: null, embeds: [embed] });
  }
};
