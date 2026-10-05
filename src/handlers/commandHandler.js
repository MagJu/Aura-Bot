const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const Logger = require("../structures/Logger");

/**
 * Loads all slash commands from the commands directory and synchronizes them with Discord.
 *
 * @param {import("../structures/NocaliaClient")} client
 */
async function loadCommands(client) {
  const commandsPath = path.join(__dirname, "../commands");
  const commandPayloads = [];

  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith(".js")) {
        try {
          const command = require(fullPath);
          if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            commandPayloads.push(command.data.toJSON());
            Logger.debug(`Loaded command: /${command.data.name}`);
          } else {
            Logger.warn(`Command at ${fullPath} is missing 'data' or 'execute'.`);
          }
        } catch (err) {
          Logger.error(`Error loading command file ${file}:`, err);
        }
      }
    }
  }

  if (fs.existsSync(commandsPath)) {
    scanDir(commandsPath);
  }

  Logger.info(`Loaded ${client.commands.size} slash command(s) into memory.`);

  // Register commands via Discord REST API
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID || (client.user ? client.user.id : null);
  const guildId = process.env.GUILD_ID;

  if (!token || !clientId) {
    Logger.warn("Skipping Discord API command registration: missing token or client ID.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    const route = guildId
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId);

    const targetLabel = guildId ? `Guild [${guildId}]` : "Global application";
    Logger.info(`Registering ${commandPayloads.length} commands to ${targetLabel}...`);

    await rest.put(route, { body: commandPayloads });
    Logger.success(`Successfully registered slash commands for ${targetLabel}.`);
  } catch (err) {
    Logger.error("Failed to register slash commands with Discord REST API:", err);
  }
}

module.exports = { loadCommands };
