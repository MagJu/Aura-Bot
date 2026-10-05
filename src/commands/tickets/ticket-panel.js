const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");
const config = require("../../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tickets")
    .setDescription("Initializes the interactive Nocalia ticket hub panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction, client) {
    const selectOptions = config.tickets.categories.map((cat) => {
      const option = new StringSelectMenuOptionBuilder()
        .setValue(cat.id)
        .setLabel(cat.label)
        .setDescription(cat.description.substring(0, 100));
      if (cat.emoji) option.setEmoji(cat.emoji);
      return option;
    });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("nocalia_select_ticket_cat")
      .setPlaceholder("👉 Select an inquiry category to open a ticket...")
      .addOptions(selectOptions);

    const row = new ActionRowBuilder().addComponents(menu);

    const embed = new EmbedBuilder()
      .setColor(config.theme.primaryColor)
      .setTitle("Nocalia Support")
      .setDescription(
        "Select a category below to open a ticket. Our team will get back to you shortly."
      )
      .setFooter({ text: "Nocalia" });

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
