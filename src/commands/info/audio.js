const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("audio")
    .setDescription("Access the Nocalia live synchronized park audio system"),
  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor(config.theme.primaryColor)
      .setTitle("🎧 Nocalia Live Synchronized Audio")
      .setDescription(
        "Experience our attractions and shows with complete spatial, studio-quality sound!\n\n" +
        `🔗 **Open Audio Portal:** [nocaliamc.com/audio](${config.theme.audioPortalUrl})\n\n` +
        "**How to connect:**\n" +
        "1. Open the audio portal in your browser.\n" +
        "2. Join the Minecraft server (`play.nocaliamc.com`).\n" +
        "3. Type `/audio` in Minecraft chat or enter your in-game nickname on the web page.\n" +
        "4. Enjoy instant, seamless ride music synchronization as you hop on attractions!"
      )
      .setFooter({ text: config.theme.footerText, iconURL: interaction.client.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
  }
};
