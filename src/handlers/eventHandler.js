const fs = require("fs");
const path = require("path");
const Logger = require("../structures/Logger");

/**
 * Loads all events from the events directory and registers them to the client.
 *
 * @param {import("../structures/NocaliaClient")} client
 */
function loadEvents(client) {
  const eventsPath = path.join(__dirname, "../events");

  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith(".js")) {
        try {
          const event = require(fullPath);
          if (event.name && event.execute) {
            if (event.once) {
              client.once(event.name, (...args) => event.execute(...args, client));
            } else {
              client.on(event.name, (...args) => event.execute(...args, client));
            }
            Logger.debug(`Registered event: ${event.name} (${file})`);
          }
        } catch (err) {
          Logger.error(`Error loading event file ${file}:`, err);
        }
      }
    }
  }

  if (fs.existsSync(eventsPath)) {
    scanDir(eventsPath);
  }
}

module.exports = { loadEvents };
