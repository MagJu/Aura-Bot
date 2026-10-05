const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) => opt.setName("target").setDescription("Member to kick").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for kick").setRequired(false)),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("target");
    const reason = interaction.options.getString("reason") || "No reason specified.";
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: "❌ Target member not found in this guild.", ephemeral: true });
      return;
    }

    if (!member.kickable) {
      await interaction.reply({ content: "❌ Cannot kick this user (role hierarchy conflict).", ephemeral: true });
      return;
    }

    await member.kick(`[By ${interaction.user.tag}]: ${reason}`);

    const embed = new EmbedBuilder()
      .setColor(config.theme.dangerColor)
      .setTitle("👢 Member Kicked")
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
