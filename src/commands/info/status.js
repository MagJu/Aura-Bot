const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Live status, online player count and ping for Nocalia"),
  async execute(interaction, client) {
    await interaction.deferReply();

    const host = process.env.NOCALIA_MC_HOST || config.minecraft.defaultHost;
    const port = parseInt(process.env.NOCALIA_MC_PORT || config.minecraft.defaultPort, 10);
    const data = await client.minecraft.getStatusJava(host, port);

    const embed = new EmbedBuilder()
      .setColor(data.online ? config.theme.successColor : config.theme.dangerColor)
      .setTitle("Nocalia — Server Status")
      .setFooter({ text: "Nocalia" })
      .setTimestamp();

    if (data.online) {
      embed
        .setDescription(`🟢 **Online** — \`${host}\``)
        .addFields(
          { name: "Players", value: `**${data.players.online}** / ${data.players.max}`, inline: true },
          { name: "Ping", value: `\`${data.ping} ms\``, inline: true },
          { name: "Version", value: `\`${data.version || config.minecraft.version}\``, inline: true }
        );
    } else {
      embed.setDescription(`🔴 **Offline** — The server is currently unreachable.`);
    }

    await interaction.editReply({ embeds: [embed] });
  }
};
