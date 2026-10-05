const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Removes a member from this ticket channel")
    .addUserOption((opt) => opt.setName("user").setDescription("The user to remove").setRequired(true)),
  async execute(interaction, client) {
    const { channel, member } = interaction;

    if (!channel.topic || !channel.topic.startsWith("nocalia-ticket:")) {
      await interaction.reply({ content: "❌ This command can only be used inside a ticket channel.", ephemeral: true });
      return;
    }

    if (!client.tickets.isStaff(member)) {
      await interaction.reply({ content: "❌ Only staff can remove members from a ticket.", ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser("user");
    await channel.permissionOverwrites.delete(targetUser.id);

    await interaction.reply({ content: `✅ Removed <@${targetUser.id}> from this ticket.` });
  }
};
