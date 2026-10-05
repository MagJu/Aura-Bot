const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const config = require("../../config/config.json");
const Logger = require("../../structures/Logger");

// Global active giveaway store
const activeGiveaways = new Map();

function parseDuration(str) {
  const match = str.trim().match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s": return num * 1000;
    case "m": return num * 60 * 1000;
    case "h": return num * 3600 * 1000;
    case "d": return num * 86400 * 1000;
    default: return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Launches an interactive community giveaway for Nocalia")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) => opt.setName("prize").setDescription("Prize to win").setRequired(true))
    .addStringOption((opt) => opt.setName("duration").setDescription("Duration (e.g. 10m, 1h, 24h, 3d)").setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName("winners").setDescription("Number of winners (default: 1)").setMinValue(1).setMaxValue(20).setRequired(false)
    ),
  activeGiveaways,
  async execute(interaction, client) {
    const prize = interaction.options.getString("prize");
    const durationStr = interaction.options.getString("duration");
    const winnersCount = interaction.options.getInteger("winners") || 1;

    const durationMs = parseDuration(durationStr);
    if (!durationMs || durationMs < 5000) {
      await interaction.reply({ content: "❌ Invalid duration. Use format: `30s`, `15m`, `2h`, `7d`.", ephemeral: true });
      return;
    }

    const endTime = Date.now() + durationMs;
    const endTimestamp = Math.floor(endTime / 1000);

    const embed = new EmbedBuilder()
      .setColor(config.theme.primaryColor)
      .setTitle(`🎉 GIVEAWAY: ${prize}`)
      .setDescription(
        `Click the button below to join!\n\n` +
        `• **Prize:** **${prize}**\n` +
        `• **Winners:** **${winnersCount}**\n` +
        `• **Hosted by:** <@${interaction.user.id}>\n` +
        `• **Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)\n\n` +
        `*Participants:* **0**`
      )
      .setFooter({ text: config.theme.footerText, iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp(endTime);

    const enterBtn = new ButtonBuilder()
      .setCustomId("btn_giveaway_join")
      .setLabel("Enter Giveaway (0)")
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(enterBtn);
    const message = await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Giveaway posted: ${message.url}`, ephemeral: true });

    const giveawayData = {
      messageId: message.id,
      channelId: interaction.channel.id,
      prize,
      winnersCount,
      endTime,
      hostId: interaction.user.id,
      participants: new Set(),
      ended: false
    };

    activeGiveaways.set(message.id, giveawayData);

    // Schedule conclusion
    setTimeout(async () => {
      if (giveawayData.ended) return;
      giveawayData.ended = true;

      try {
        const chan = await client.channels.fetch(giveawayData.channelId).catch(() => null);
        if (!chan) return;
        const msg = await chan.messages.fetch(giveawayData.messageId).catch(() => null);
        if (!msg) return;

        const entries = Array.from(giveawayData.participants);
        if (entries.length === 0) {
          const finishedEmbed = EmbedBuilder.from(msg.embeds[0])
            .setColor(config.theme.dangerColor)
            .setTitle(`🎉 GIVEAWAY ENDED: ${prize}`)
            .setDescription(`No participants entered the giveaway.\n• **Prize:** **${prize}**`);
          await msg.edit({ embeds: [finishedEmbed], components: [] });
          await chan.send(`⚠️ The giveaway for **${prize}** ended with no entries.`);
          return;
        }

        const shuffled = [...entries].sort(() => 0.5 - Math.random());
        const winners = shuffled.slice(0, Math.min(winnersCount, shuffled.length));
        const winnerMentions = winners.map((id) => `<@${id}>`).join(", ");

        const finishedEmbed = EmbedBuilder.from(msg.embeds[0])
          .setColor(config.theme.successColor)
          .setTitle(`🎉 GIVEAWAY ENDED: ${prize}`)
          .setDescription(
            `🏆 **Winner(s):** ${winnerMentions}\n\n` +
            `• **Prize:** **${prize}**\n` +
            `• **Total Participants:** **${entries.length}**\n` +
            `• **Hosted by:** <@${giveawayData.hostId}>`
          );

        await msg.edit({ embeds: [finishedEmbed], components: [] });
        await chan.send({
          content: `🎉 Congratulations ${winnerMentions}! You won **${prize}**! 🎁 Contact <@${giveawayData.hostId}> to claim!`
        });
      } catch (err) {
        Logger.error("Failed to conclude giveaway:", err);
      }
    }, durationMs);
  }
};
