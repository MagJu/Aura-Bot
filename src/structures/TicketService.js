const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");
const discordTranscripts = require("discord-html-transcripts");
const Logger = require("./Logger");
const config = require("../config/config.json");

class TicketService {
  constructor() {
    this.openTickets = new Set();
  }

  isStaff(member, allowedRoles = []) {
    if (!member) return false;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    if (process.env.STAFF_ROLE_ID && member.roles.cache.has(process.env.STAFF_ROLE_ID)) return true;
    return allowedRoles.some((r) => member.roles.cache.has(r));
  }

  async openTicketModal(interaction, categoryId) {
    const category = config.tickets.categories.find((c) => c.id === categoryId);
    if (!category) {
      await interaction.reply({ content: "❌ Unknown ticket category.", ephemeral: true });
      return;
    }

    const userKey = `${interaction.guildId}_${interaction.user.id}`;
    if (this.openTickets.has(userKey) && config.tickets.categoryLimit <= 1) {
      await interaction.reply({
        content: "⚠️ You already have an active ticket. Please close it before opening a new one.",
        ephemeral: true
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${category.id}`)
      .setTitle(`Nocalia • ${category.label}`.substring(0, 45));

    for (const field of category.fields) {
      const input = new TextInputBuilder()
        .setCustomId(`field_${field.id}`)
        .setLabel(field.label.substring(0, 45))
        .setStyle(field.style === "SHORT" ? TextInputStyle.Short : TextInputStyle.Paragraph)
        .setRequired(Boolean(field.required))
        .setMaxLength(Math.min(field.maxLength || 1000, 1000));

      if (field.placeholder) {
        input.setPlaceholder(field.placeholder.substring(0, 100));
      }

      modal.addComponents(new ActionRowBuilder().addComponents(input));
    }

    await interaction.showModal(modal);
  }

  async createTicket(interaction, categoryId) {
    await interaction.deferReply({ ephemeral: true });

    const { guild, user } = interaction;
    const category = config.tickets.categories.find((c) => c.id === categoryId);
    if (!category) return;

    const userKey = `${guild.id}_${user.id}`;
    const cleanUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 15);
    const channelName = `${category.prefix || "ticket-"}${cleanUsername}`;

    // Permissions
    const permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      },
      {
        id: guild.members.me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ]
      }
    ];

    const staffRoles = [...(category.allowedRoles || [])];
    if (process.env.STAFF_ROLE_ID && !staffRoles.includes(process.env.STAFF_ROLE_ID)) {
      staffRoles.push(process.env.STAFF_ROLE_ID);
    }

    for (const rId of staffRoles) {
      if (guild.roles.cache.has(rId)) {
        permissionOverwrites.push({
          id: rId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ManageMessages
          ]
        });
      }
    }

    try {
      const parentId = category.categoryId && guild.channels.cache.has(category.categoryId)
        ? category.categoryId
        : null;

      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: parentId,
        topic: `nocalia-ticket:${category.id}|user:${user.id}|time:${Date.now()}`,
        permissionOverwrites
      });

      this.openTickets.add(userKey);

      // Collect answers
      const fields = [];
      for (const f of category.fields) {
        const val = interaction.fields.getTextInputValue(`field_${f.id}`) || "N/A";
        fields.push({
          name: `📌 ${f.label}`,
          value: val.substring(0, 1024),
          inline: false
        });
      }

      const welcomeEmbed = new EmbedBuilder()
        .setColor(config.theme.primaryColor)
        .setTitle(`${category.emoji} ${category.label}`)
        .setDescription(`Ticket created by <@${user.id}>. A staff member will assist you shortly.`)
        .addFields(fields)
        .setFooter({ text: "Nocalia" })
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("btn_ticket_close")
          .setLabel("Close Ticket")
          .setEmoji("🔒")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("btn_ticket_claim")
          .setLabel("Claim")
          .setEmoji("📌")
          .setStyle(ButtonStyle.Secondary)
      );

      if (category.isRecruitment) {
        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId("btn_recruit_accept")
            .setLabel("Accept Application")
            .setEmoji("✅")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("btn_recruit_reject")
            .setLabel("Reject Application")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Secondary)
        );
      }

      await channel.send({
        content: `<@${user.id}> Welcome! ${staffRoles.map((r) => `<@&${r}>`).join(" ")}`,
        embeds: [welcomeEmbed],
        components: [actionRow]
      });

      await interaction.editReply({ content: `✅ Ticket opened in <#${channel.id}>` });
      Logger.info(`Ticket created: #${channelName} by ${user.tag}`);
    } catch (err) {
      Logger.error("Failed to create ticket channel:", err);
      await interaction.editReply({ content: "❌ An error occurred while creating your ticket channel." });
    }
  }

  async closeTicket(interaction) {
    const { channel, user, guild } = interaction;

    await interaction.reply({ content: "🔒 Archiving and closing ticket...", ephemeral: false });

    try {
      const transcript = await discordTranscripts.createTranscript(channel, {
        limit: -1,
        returnType: "attachment",
        filename: `${channel.name}-transcript.html`,
        saveImages: true,
        poweredBy: false
      });

      let creatorId = null;
      if (channel.topic) {
        const match = channel.topic.match(/user:(\d+)/);
        if (match) creatorId = match[1];
      }

      if (creatorId) {
        this.openTickets.delete(`${guild.id}_${creatorId}`);
        const creator = await guild.client.users.fetch(creatorId).catch(() => null);
        if (creator) {
          const dmEmbed = new EmbedBuilder()
            .setColor(config.theme.primaryColor)
            .setTitle(`📜 Ticket Closed • #${channel.name}`)
            .setDescription(
              `Your ticket on **${guild.name}** was closed by <@${user.id}>.\n` +
              "Attached is your complete HTML conversation transcript for your records."
            )
            .setFooter({ text: config.theme.footerText })
            .setTimestamp();

          await creator.send({ embeds: [dmEmbed], files: [transcript] }).catch(() => null);
        }
      }

      const logChannelId = process.env.TICKET_LOG_CHANNEL_ID;
      if (logChannelId && guild.channels.cache.has(logChannelId)) {
        const logChannel = guild.channels.cache.get(logChannelId);
        const logEmbed = new EmbedBuilder()
          .setColor(config.theme.primaryColor)
          .setTitle(`📁 Ticket Closed • #${channel.name}`)
          .addFields(
            { name: "Closed By", value: `<@${user.id}>`, inline: true },
            { name: "Creator", value: creatorId ? `<@${creatorId}>` : "Unknown", inline: true }
          )
          .setFooter({ text: config.theme.footerText })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed], files: [transcript] }).catch((e) => {
          Logger.error("Failed to send transcript to log channel:", e);
        });
      }

      await channel.send("⚠️ *This channel will be deleted in 5 seconds...*");
      setTimeout(() => {
        channel.delete("Closed by user/staff").catch(() => null);
      }, 5000);
    } catch (err) {
      Logger.error("Error closing ticket:", err);
      await channel.send("❌ Error generating transcript.");
    }
  }
}

module.exports = new TicketService();
