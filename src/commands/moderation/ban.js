const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) => opt.setName("target").setDescription("Member to ban").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for ban").setRequired(false))
    .addIntegerOption((opt) =>
      opt
        .setName("days")
        .setDescription("Days of message history to delete (0 to 7)")
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "No reason specified.";
    const days = interaction.options.getInteger("days") || 0;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (member && !member.bannable) {
      await interaction.reply({ content: "❌ Cannot ban this user (role hierarchy conflict).", ephemeral: true });
      return;
    }

    await interaction.guild.bans.create(targetUser.id, {
      reason: `[By ${interaction.user.tag}]: ${reason}`,
      deleteMessageSeconds: days * 86400
    });

    const embed = new EmbedBuilder()
      .setColor(config.theme.dangerColor)
      .setTitle("🔨 Member Banned")
      .setDescription(
        `**User:** <@${targetUser.id}> (\`${targetUser.tag}\`)\n` +
        `**Staff:** <@${interaction.user.id}>\n` +
        `**Reason:** ${reason}`
      )
      .setFooter({ text: config.theme.footerText })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
