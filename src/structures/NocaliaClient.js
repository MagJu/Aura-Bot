const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const Logger = require("./Logger");
const minecraftService = require("./MinecraftService");
const ticketService = require("./TicketService");
const statsService = require("./StatsService");

class NocaliaClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
      ]
    });

    this.commands = new Collection();
    this.minecraft = minecraftService;
    this.tickets = ticketService;
    this.stats = statsService;
  }

  async start() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      Logger.error("DISCORD_TOKEN is missing in the environment. Please configure .env");
      return;
    }

    try {
      await this.login(token);
    } catch (err) {
      Logger.error("Failed to connect to Discord Gateway:", err);
    }
  }
}

module.exports = NocaliaClient;
