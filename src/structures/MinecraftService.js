const util = require("minecraft-server-util");
const Logger = require("./Logger");
const config = require("../config/config.json");

class MinecraftService {
  constructor() {
    this.cache = new Map();
    this.ttl = config.minecraft.cacheTtlMs || 30000;
  }

  async getStatusJava(host = process.env.NOCALIA_MC_HOST || config.minecraft.defaultHost, port = parseInt(process.env.NOCALIA_MC_PORT || config.minecraft.defaultPort, 10)) {
    const key = `java:${host}:${port}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.time < this.ttl) {
      return cached.data;
    }

    try {
      const response = await util.status(host, port, {
        timeout: 4000,
        enableSRV: true
      });

      const data = {
        online: true,
        host,
        port,
        version: response.version?.name || "1.21+",
        players: {
          online: response.players?.online || 0,
          max: response.players?.max || 0,
          sample: response.players?.sample || []
        },
        motd: response.motd?.clean || response.motd?.raw || "Welcome to Nocalia!",
        ping: response.roundTripLatency || 0,
        favicon: response.favicon
      };

      this.cache.set(key, { time: Date.now(), data });
      return data;
    } catch (err) {
      Logger.debug(`Java ping unreachable for ${host}:${port}: ${err.message}`);
      const data = { online: false, host, port, error: err.message };
      this.cache.set(key, { time: Date.now(), data });
      return data;
    }
  }

  async getStatusBedrock(host = process.env.NOCALIA_MC_HOST || config.minecraft.defaultHost, port = parseInt(process.env.NOCALIA_BEDROCK_PORT || config.minecraft.bedrockPort, 10)) {
    const key = `bedrock:${host}:${port}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.time < this.ttl) {
      return cached.data;
    }

    try {
      const response = await util.statusBedrock(host, port, { timeout: 4000 });
      const data = {
        online: true,
        host,
        port,
        version: response.version?.name || "Bedrock",
        players: {
          online: response.players?.online || 0,
          max: response.players?.max || 0
        },
        motd: response.motd?.clean || "Nocalia Bedrock"
      };

      this.cache.set(key, { time: Date.now(), data });
      return data;
    } catch (err) {
      Logger.debug(`Bedrock ping unreachable for ${host}:${port}: ${err.message}`);
      const data = { online: false, host, port, error: err.message };
      this.cache.set(key, { time: Date.now(), data });
      return data;
    }
  }
}

module.exports = new MinecraftService();
