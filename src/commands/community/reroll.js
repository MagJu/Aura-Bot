const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { activeGiveaways } = require("./giveaway");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reroll")
    .setDescription("Rerolls a new winner for a concluded giveaway")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) => opt.setName("message_id").setDescription("Giveaway message ID").setRequired(true)),
  async execute(interaction) {
    const messageId = interaction.options.getString("message_id").trim();
    const giveaway = activeGiveaways.get(messageId);

    if (!giveaway) {
      await interaction.reply({ content: "❌ Giveaway not found in memory cache.", ephemeral: true });
      return;
    }

    const participants = Array.from(giveaway.participants);
    if (participants.length === 0) {
      await interaction.reply({ content: "❌ No participants joined to reroll.", ephemeral: true });
      return;
    }

    const newWinner = participants[Math.floor(Math.random() * participants.length)];
    await interaction.channel.send(`🎉 **Reroll Winner for ${giveaway.prize}!** Congratulations <@${newWinner}>! 🏆`);
    await interaction.reply({ content: `✅ Rerolled! New winner is <@${newWinner}>.`, ephemeral: true });
  }
};
