const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const Logger = require("../../structures/Logger");
const config = require("../../config/config.json");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    try {
      // 1. Slash Commands
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          Logger.warn(`Slash command not found: /${interaction.commandName}`);
          return;
        }

        try {
          await command.execute(interaction, client);
        } catch (err) {
          Logger.error(`Error running command /${interaction.commandName}:`, err);
          const replyContent = {
            content: "❌ An internal error occurred while executing this command.",
            ephemeral: true
          };
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyContent);
          } else {
            await interaction.reply(replyContent);
          }
        }
        return;
      }

      // 2. Select Menus (Ticket creation dropdown)
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "nocalia_select_ticket_cat") {
          const categoryId = interaction.values[0];
          await client.tickets.openTicketModal(interaction, categoryId);
        }
        return;
      }

      // 3. Modals Submit (Ticket creation & Staff response)
      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith("ticket_modal_")) {
          const categoryId = interaction.customId.replace("ticket_modal_", "");
          await client.tickets.createTicket(interaction, categoryId);
          return;
        }

        if (interaction.customId === "modal_recruit_accept" || interaction.customId === "modal_recruit_reject") {
          await interaction.deferReply();
          const isAccepted = interaction.customId === "modal_recruit_accept";
          const reason = interaction.fields.getTextInputValue("field_decision_reason") || "No comments.";

          const embed = new EmbedBuilder()
            .setColor(isAccepted ? config.theme.successColor : config.theme.dangerColor)
            .setTitle(isAccepted ? "✅ Application Accepted" : "❌ Application Rejected")
            .setDescription(
              `Evaluated by <@${interaction.user.id}>:\n\n` +
              `**Result:** ${isAccepted ? "Accepted" : "Not Selected"}\n` +
              `**Feedback:**\n>>> ${reason}`
            )
            .setFooter({ text: config.theme.footerText })
            .setTimestamp();

          await interaction.channel.send({ embeds: [embed] });
          await interaction.deleteReply().catch(() => null);
          return;
        }
        return;
      }

      // 4. Buttons (Tickets, Claim, Close, Recruitment, Giveaway)
      if (interaction.isButton()) {
        const { customId, member, channel, user } = interaction;

        // Close ticket button
        if (customId === "btn_ticket_close") {
          await client.tickets.closeTicket(interaction);
          return;
        }

        // Claim ticket button
        if (customId === "btn_ticket_claim") {
          if (!client.tickets.isStaff(member)) {
            await interaction.reply({ content: "❌ Only staff can claim tickets.", ephemeral: true });
            return;
          }
          const embed = new EmbedBuilder()
            .setColor(config.theme.primaryColor)
            .setDescription(`📌 This ticket has been claimed by <@${user.id}>.`);
          await interaction.reply({ embeds: [embed] });
          return;
        }

        // Recruitment decision buttons
        if (customId === "btn_recruit_accept" || customId === "btn_recruit_reject") {
          if (!client.tickets.isStaff(member)) {
            await interaction.reply({ content: "❌ Only staff can evaluate applications.", ephemeral: true });
            return;
          }
          const isAccept = customId === "btn_recruit_accept";
          const modal = new ModalBuilder()
            .setCustomId(isAccept ? "modal_recruit_accept" : "modal_recruit_reject")
            .setTitle(isAccept ? "Accept Application" : "Reject Application");

          const input = new TextInputBuilder()
            .setCustomId("field_decision_reason")
            .setLabel("Feedback & Next Steps")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000)
            .setPlaceholder("Provide onboarding details or helpful constructive feedback...");

          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await interaction.showModal(modal);
          return;
        }

        // Giveaway join button
        if (customId === "btn_giveaway_join") {
          const { activeGiveaways } = require("../../commands/community/giveaway");
          const giveaway = activeGiveaways.get(interaction.message.id);
          if (!giveaway || giveaway.ended) {
            await interaction.reply({ content: "❌ This giveaway has ended.", ephemeral: true });
            return;
          }

          let joined = false;
          if (giveaway.participants.has(user.id)) {
            giveaway.participants.delete(user.id);
            joined = false;
          } else {
            giveaway.participants.add(user.id);
            joined = true;
          }

          const count = giveaway.participants.size;
          const { ActionRowBuilder: Row, ButtonBuilder: Btn, ButtonStyle: Style, EmbedBuilder: Emb } = require("discord.js");
          const updatedRow = new Row().addComponents(
            new Btn()
              .setCustomId("btn_giveaway_join")
              .setLabel(`Enter Giveaway (${count})`)
              .setEmoji("🎉")
              .setStyle(Style.Success)
          );

          const oldEmbed = interaction.message.embeds[0];
          const newDesc = oldEmbed.description.replace(/\*Participants:\* \*\*\d+\*\*/, `*Participants:* **${count}**`);
          const updatedEmbed = Emb.from(oldEmbed).setDescription(newDesc);

          await interaction.message.edit({ embeds: [updatedEmbed], components: [updatedRow] });
          await interaction.reply({
            content: joined
              ? `🎉 You joined the giveaway for **${giveaway.prize}**!`
              : `👋 You left the giveaway for **${giveaway.prize}**.`,
            ephemeral: true
          });
          return;
        }

        // Suggestion Voting Buttons
        if (customId === "btn_suggest_up" || customId === "btn_suggest_down") {
          const { suggestionsStore } = require("../../commands/community/suggest");
          let suggestion = suggestionsStore.get(interaction.message.id);

          if (!suggestion) {
            suggestion = {
              upvotes: new Set(),
              downvotes: new Set(),
              status: "pending"
            };
            suggestionsStore.set(interaction.message.id, suggestion);
          }

          if (suggestion.status !== "pending") {
            await interaction.reply({ content: "⚠️ This suggestion has already been reviewed by the Crew.", ephemeral: true });
            return;
          }

          let responseText = "";
          if (customId === "btn_suggest_up") {
            if (suggestion.upvotes.has(user.id)) {
              suggestion.upvotes.delete(user.id);
              responseText = "Removed your upvote.";
            } else {
              suggestion.upvotes.add(user.id);
              suggestion.downvotes.delete(user.id);
              responseText = "👍 Upvoted this suggestion!";
            }
          } else {
            if (suggestion.downvotes.has(user.id)) {
              suggestion.downvotes.delete(user.id);
              responseText = "Removed your downvote.";
            } else {
              suggestion.downvotes.add(user.id);
              suggestion.upvotes.delete(user.id);
              responseText = "👎 Downvoted this suggestion.";
            }
          }

          const upCount = suggestion.upvotes.size;
          const downCount = suggestion.downvotes.size;

          const { ActionRowBuilder: Row, ButtonBuilder: Btn, ButtonStyle: Style } = require("discord.js");
          const newRow = new Row().addComponents(
            new Btn().setCustomId("btn_suggest_up").setLabel(`Upvote (${upCount})`).setEmoji("👍").setStyle(Style.Success),
            new Btn().setCustomId("btn_suggest_down").setLabel(`Downvote (${downCount})`).setEmoji("👎").setStyle(Style.Danger),
            new Btn().setCustomId("btn_suggest_accept").setLabel("Accept").setEmoji("✅").setStyle(Style.Secondary),
            new Btn().setCustomId("btn_suggest_decline").setLabel("Decline").setEmoji("❌").setStyle(Style.Secondary)
          );

          await interaction.message.edit({ components: [newRow] });
          await interaction.reply({ content: responseText, ephemeral: true });
          return;
        }

        // Suggestion Crew Evaluation Buttons
        if (customId === "btn_suggest_accept" || customId === "btn_suggest_decline") {
          if (!client.tickets.isStaff(member)) {
            await interaction.reply({ content: "❌ Only the Crew can evaluate community suggestions.", ephemeral: true });
            return;
          }

          const { suggestionsStore } = require("../../commands/community/suggest");
          let suggestion = suggestionsStore.get(interaction.message.id);
          if (!suggestion) {
            suggestion = { upvotes: new Set(), downvotes: new Set() };
            suggestionsStore.set(interaction.message.id, suggestion);
          }

          const isAccepted = customId === "btn_suggest_accept";
          suggestion.status = isAccepted ? "accepted" : "declined";

          const oldEmbed = interaction.message.embeds[0];
          const newFields = oldEmbed.fields.map((f) => {
            if (f.name === "Status") {
              return {
                name: "Status",
                value: isAccepted ? `🟢 **Accepted by <@${user.id}>**` : `🔴 **Declined by <@${user.id}>**`,
                inline: true
              };
            }
            return f;
          });

          const { EmbedBuilder: Emb } = require("discord.js");
          const updatedEmbed = Emb.from(oldEmbed)
            .setColor(isAccepted ? config.theme.successColor : config.theme.dangerColor)
            .setFields(newFields);

          await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
          await interaction.reply({
            content: `Suggestion marked as **${isAccepted ? "Accepted" : "Declined"}**.`,
            ephemeral: true
          });
          return;
        }
      }
    } catch (err) {
      Logger.error("Error in interactionCreate event:", err);
    }
  }
};
