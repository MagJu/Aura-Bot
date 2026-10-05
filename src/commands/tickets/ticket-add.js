const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Grants a member access to this ticket channel")
    .addUserOption((opt) => opt.setName("user").setDescription("The user to add").setRequired(true)),
  async execute(interaction, client) {
    const { channel, member } = interaction;

    if (!channel.topic || !channel.topic.startsWith("nocalia-ticket:")) {
      await interaction.reply({ content: "❌ This command can only be used inside a ticket channel.", ephemeral: true });
      return;
    }

    if (!client.tickets.isStaff(member)) {
      await interaction.reply({ content: "❌ Only staff can add members to a ticket.", ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser("user");
    await channel.permissionOverwrites.edit(targetUser.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });

    await interaction.reply({ content: `✅ Added <@${targetUser.id}> to this ticket.` });
  }
};
