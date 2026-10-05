const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require("../../config/config.json");
const Logger = require("../../structures/Logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("update")
    .setDescription("Publish an official park update or changelog in #park-updates")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) =>
      opt
        .setName("title")
        .setDescription("Title of the update (e.g. Danse Macabre Opening, Patch 1.2)")
        .setRequired(true)
        .setMaxLength(100)
    )
    .addStringOption((opt) =>
      opt
        .setName("content")
        .setDescription("Details and changelog (use \\n for line breaks)")
        .setRequired(true)
        .setMaxLength(4000)
    )
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("Category of the update")
        .setRequired(false)
        .addChoices(
          { name: "🎢 Attraction & Rides", value: "Attraction" },
          { name: "🏰 Park & Theming", value: "Theming" },
          { name: "🛠️ Technical & Maintenance", value: "Technical" },
          { name: "✨ Show & Animation", value: "Show" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("image")
        .setDescription("Optional direct image URL to embed in the update")
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const { member, guild, user } = interaction;

    // Check staff permissions
    if (!client.tickets.isStaff(member)) {
      await interaction.reply({
        content: "❌ Only Crew members can publish official park updates.",
        ephemeral: true
      });
      return;
    }

    const title = interaction.options.getString("title");
    const rawContent = interaction.options.getString("content");
    const updateType = interaction.options.getString("type") || "Attraction";
    const imageUrl = interaction.options.getString("image");

    // Replace literal '\n' with actual newlines
    const content = rawContent.replace(/\\n/g, "\n");

    // Find park-updates channel
    const updateChannel = guild.channels.cache.find((c) => c.name.includes("park-updates"));

    if (!updateChannel) {
      await interaction.reply({
        content: "❌ Could not locate the `#park-updates` channel.",
        ephemeral: true
      });
      return;
    }

    const typeIcons = {
      Attraction: "🎢",
      Theming: "🏰",
      Technical: "🛠️",
      Show: "✨"
    };

    const icon = typeIcons[updateType] || "🎢";

    const embed = new EmbedBuilder()
      .setColor(config.theme.primaryColor)
      .setTitle(`${icon} Park Update — ${title}`)
      .setDescription(content)
      .addFields(
        { name: "Category", value: `${icon} ${updateType}`, inline: true },
        { name: "Published by", value: `<@${user.id}>`, inline: true }
      )
      .setFooter({ text: "Nocalia Park Updates" })
      .setTimestamp();

    if (imageUrl && imageUrl.startsWith("http")) {
      embed.setImage(imageUrl);
    }

    const postedMsg = await updateChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: `✅ Update published successfully in <#${updateChannel.id}>: ${postedMsg.url}`,
      ephemeral: true
    });

    Logger.info(`Park update published by ${user.tag}: "${title}" in #${updateChannel.name}`);
  }
};
