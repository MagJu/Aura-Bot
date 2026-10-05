const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ip")
    .setDescription("Displays connection addresses and versions for Nocalia"),
  async execute(interaction, client) {
    const javaHost = process.env.NOCALIA_MC_HOST || config.minecraft.defaultHost;
    const version = config.minecraft.version || "26.2";

    const embed = new EmbedBuilder()
      .setColor(config.theme.primaryColor)
      .setTitle("Nocalia — Server Address")
      .addFields(
        {
          name: "🎮 Minecraft Java",
          value: `\`\`\`${javaHost}\`\`\`\nVersion: **${version}**`,
          inline: false
        },
        {
          name: "🌐 Website",
          value: "https://nocaliamc.com",
          inline: false
        }
      )
      .setFooter({ text: "Nocalia" });

    await interaction.reply({ embeds: [embed] });
  }
};
