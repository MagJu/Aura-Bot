const { Events, EmbedBuilder } = require("discord.js");
const Logger = require("../../structures/Logger");
const config = require("../../config/config.json");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member, client) {
    try {
      // 1. Assign default role if configured
      const defaultRoleId = process.env.DEFAULT_ROLE_ID;
      if (defaultRoleId && member.guild.roles.cache.has(defaultRoleId)) {
        await member.roles.add(defaultRoleId).catch((e) => {
          Logger.warn(`Could not assign default role to ${member.user.tag}: ${e.message}`);
        });
      }

      // 2. Send welcome message if configured
      const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
      if (welcomeChannelId && member.guild.channels.cache.has(welcomeChannelId)) {
        const channel = member.guild.channels.cache.get(welcomeChannelId);
        const embed = new EmbedBuilder()
          .setColor(config.theme.primaryColor)
          .setTitle("Welcome to Nocalia!")
          .setDescription(
            `Welcome <@${member.user.id}> to the server.\n\n` +
            `• Server IP: \`${config.minecraft.defaultHost}\`\n` +
            `• Website: ${config.theme.websiteUrl}`
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: "Nocalia" });

        await channel.send({ embeds: [embed] }).catch(() => null);
      }
    } catch (err) {
      Logger.error(`Error in guildMemberAdd for ${member.user.tag}:`, err);
    }
  }
};
