const { ChannelType, PermissionFlagsBits } = require("discord.js");
const Logger = require("./Logger");
const config = require("../config/config.json");
const fs = require("fs");
const path = require("path");

class StatsService {
  constructor() {
    this.interval = (config.stats?.intervalMinutes || 10) * 60 * 1000;
  }

  /**
   * Initializes the automatic stats counter loops.
   *
   * @param {import("./NocaliaClient")} client
   */
  init(client) {
    if (config.stats && config.stats.enabled === false) {
      Logger.info("Stats counter service is disabled in config.json.");
      return;
    }

    Logger.info("Initializing Stats Counter Service (10 min cycle)...");

    // First update after 10 seconds of startup
    setTimeout(() => {
      this.updateAllGuilds(client);
    }, 10000);

    // Regular interval
    setInterval(() => {
      this.updateAllGuilds(client);
    }, this.interval);
  }

  async updateAllGuilds(client) {
    for (const guild of client.guilds.cache.values()) {
      try {
        await this.updateGuildStats(guild, client);
      } catch (err) {
        Logger.error(`Error updating stats for guild ${guild.name}:`, err);
      }
    }
  }

  /**
   * Updates or creates the stats channels for a given guild.
   *
   * @param {import("discord.js").Guild} guild
   * @param {import("./NocaliaClient")} client
   */
  async updateGuildStats(guild, client) {
    const configPath = path.join(__dirname, "../config/config.json");
    const currentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!currentConfig.stats) {
      currentConfig.stats = { enabled: true, intervalMinutes: 10, channels: {} };
    }

    // 1. Fetch Minecraft server data
    const host = process.env.NOCALIA_MC_HOST || currentConfig.minecraft.defaultHost;
    const port = parseInt(process.env.NOCALIA_MC_PORT || currentConfig.minecraft.defaultPort, 10);
    const mcData = await client.minecraft.getStatusJava(host, port);

    // 2. Compute dynamic stats strings
    const memberCount = guild.memberCount || 0;
    const membersName = `👥・Members: ${memberCount}`;
    const playersName = mcData.online
      ? `🎮・Online: ${mcData.players.online} / ${mcData.players.max}`
      : `🎮・Players: 0`;
    const statusName = mcData.online ? `🟢・Status: Online` : `🔴・Status: Offline`;

    const channelsConfig = currentConfig.stats.channels || {};

    // 3. Ensure Category exists
    let category = channelsConfig.categoryId
      ? await guild.channels.fetch(channelsConfig.categoryId).catch(() => null)
      : null;

    if (!category) {
      category = guild.channels.cache.find((c) => c.name.includes("SERVER STATS"));
    }

    if (!category) {
      category = await guild.channels.create({
        name: "╭── 📊 SERVER STATS ──╮",
        type: ChannelType.GuildCategory,
        position: 0
      });
      channelsConfig.categoryId = category.id;
    }

    // 4. Update or Create Channels
    const updateChannel = async (key, expectedName) => {
      let chan = channelsConfig[key]
        ? await guild.channels.fetch(channelsConfig[key]).catch(() => null)
        : null;

      if (!chan) {
        chan = await guild.channels.create({
          name: expectedName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.Connect] // Lock voice channel so it functions purely as counter
            }
          ]
        });
        channelsConfig[key] = chan.id;
      } else {
        if (chan.name !== expectedName) {
          await chan.setName(expectedName).catch((err) => {
            Logger.debug(`Could not rename channel ${chan.id} (rate limit): ${err.message}`);
          });
        }
      }
    };

    await updateChannel("members", membersName);
    await updateChannel("players", playersName);
    await updateChannel("status", statusName);

    currentConfig.stats.channels = channelsConfig;
    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
    Logger.debug(`Stats updated for ${guild.name}: Members=${memberCount}, MC=${mcData.players?.online || 0}`);
  }
}

module.exports = new StatsService();
