require("dotenv").config();
const NocaliaClient = require("./structures/NocaliaClient");
const { loadEvents } = require("./handlers/eventHandler");
const Logger = require("./structures/Logger");

// Graceful process error handling
process.on("uncaughtException", (err) => {
  Logger.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  Logger.error("Unhandled Rejection:", reason);
});

// Initialize client
const client = new NocaliaClient();

// Register all event listeners
loadEvents(client);

// Connect to Discord
client.start();
