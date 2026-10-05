const { Events, ActivityType } = require("discord.js");
const Logger = require("../../structures/Logger");
const { loadCommands } = require("../../handlers/commandHandler");
const config = require("../../config/config.json");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    Logger.success("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Logger.success(`✨ Aura (${config.theme.networkTitle}) Online!`);
    Logger.success(`Logged in as: ${client.user.tag} (ID: ${client.user.id})`);
    Logger.success(`Serving in ${client.guilds.cache.size} server(s).`);
    Logger.success("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Register & sync slash commands
    await loadCommands(client);

    // Initialize live stats counters
    client.stats.init(client);

    // Rotating presence status
    const activities = [
      { name: "play.nocaliamc.com", type: ActivityType.Playing },
      { name: "nocaliamc.com/audio", type: ActivityType.Listening },
      { name: "Custom Theme Park Attractions", type: ActivityType.Watching },
      { name: "/status • /tickets • /ip", type: ActivityType.Playing }
    ];

    let index = 0;
    setInterval(() => {
      client.user.setPresence({
        activities: [activities[index]],
        status: "online"
      });
      index = (index + 1) % activities.length;
    }, 15000);
  }
};
