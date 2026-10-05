const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const config = require("../../config/config.json");
const Logger = require("../../structures/Logger");

// In-memory store for suggestion votes: messageId -> { upvotes: Set<userId>, downvotes: Set<userId>, authorId, status }
const suggestionsStore = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Submit an idea, ride concept, or feedback for Nocalia")
    .addStringOption((opt) =>
      opt
        .setName("idea")
        .setDescription("Describe your suggestion in detail")
        .setRequired(true)
        .setMinLength(10)
        .setMaxLength(1000)
    ),
  suggestionsStore,
  async execute(interaction, client) {
    const idea = interaction.options.getString("idea");
    const { guild, user } = interaction;

    // Find ideas-and-feedback channel
    const feedbackChannel = guild.channels.cache.find((c) => c.name.includes("ideas-and-feedback"));

    if (!feedbackChannel) {
      await interaction.reply({
        content: "❌ Could not find the `#ideas-and-feedback` channel. Please inform staff.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(config.theme.warningColor)
      .setTitle("💡 New Community Suggestion")
      .setDescription(idea)
      .addFields(
        { name: "Author", value: `<@${user.id}>`, inline: true },
        { name: "Status", value: "🟡 **Under Community Review**", inline: true }
      )
      .setFooter({ text: "Nocalia Feedback" })
      .setTimestamp();

    const voteRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("btn_suggest_up")
        .setLabel("Upvote (0)")
        .setEmoji("👍")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("btn_suggest_down")
        .setLabel("Downvote (0)")
        .setEmoji("👎")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("btn_suggest_accept")
        .setLabel("Accept")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("btn_suggest_decline")
        .setLabel("Decline")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Secondary)
    );

    const message = await feedbackChannel.send({ embeds: [embed], components: [voteRow] });

    // Store suggestion data
    suggestionsStore.set(message.id, {
      authorId: user.id,
      upvotes: new Set(),
      downvotes: new Set(),
      status: "pending"
    });

    await interaction.reply({
      content: `✅ Your suggestion has been posted in <#${feedbackChannel.id}>! Go check it out.`,
      ephemeral: true
    });

    Logger.info(`New suggestion posted by ${user.tag}: "${idea.substring(0, 50)}..."`);
  }
};
