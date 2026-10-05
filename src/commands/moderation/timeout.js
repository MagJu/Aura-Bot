const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Places a member into temporary timeout")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName("target").setDescription("Member to timeout").setRequired(true))
    .addIntegerOption((opt) =>
      opt
        .setName("minutes")
        .setDescription("Duration in minutes (e.g., 5, 60, 1440)")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for timeout").setRequired(false)),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("target");
    const minutes = interaction.options.getInteger("minutes");
    const reason = interaction.options.getString("reason") || "No reason specified.";
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: "❌ Target member not found in this guild.", ephemeral: true });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({ content: "❌ Cannot timeout this member (role hierarchy conflict).", ephemeral: true });
      return;
    }

    await member.timeout(minutes * 60 * 1000, `[By ${interaction.user.tag}]: ${reason}`);

    const embed = new EmbedBuilder()
      .setColor(config.theme.warningColor)
      .setTitle("⏳ Member Timed Out")
      .setDescription(
        `**User:** <@${targetUser.id}> (\`${targetUser.tag}\`)\n` +
        `**Duration:** \`${minutes} minute(s)\`\n` +
        `**Staff:** <@${interaction.user.id}>\n` +
        `**Reason:** ${reason}`
      )
      .setFooter({ text: config.theme.footerText })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
