const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unbans a user using their Discord ID")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((opt) => opt.setName("user_id").setDescription("Discord ID to unban").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for unban").setRequired(false)),
  async execute(interaction) {
    const userId = interaction.options.getString("user_id").trim();
    const reason = interaction.options.getString("reason") || "No reason specified.";

    try {
      await interaction.guild.bans.remove(userId, `[By ${interaction.user.tag}]: ${reason}`);

      const embed = new EmbedBuilder()
        .setColor(config.theme.successColor)
        .setTitle("🔓 Member Unbanned")
        .setDescription(
          `**User ID:** \`${userId}\`\n` +
          `**Staff:** <@${interaction.user.id}>\n` +
          `**Reason:** ${reason}`
        )
        .setFooter({ text: config.theme.footerText })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: `❌ Could not unban user ID \`${userId}\`. Verify that the ID is valid and banned.`, ephemeral: true });
    }
  }
};
