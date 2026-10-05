/**
 * Clean terminal logger for Nocalia Bot.
 */

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  purple: "\x1b[35m",
  gray: "\x1b[90m"
};

function timestamp() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

class Logger {
  static info(message, ...args) {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}[NOCALIA/INFO]${colors.reset} ${message}`, ...args);
  }

  static success(message, ...args) {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.green}[NOCALIA/SUCCESS]${colors.reset} ${message}`, ...args);
  }

  static warn(message, ...args) {
    console.warn(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.yellow}[NOCALIA/WARN]${colors.reset} ${message}`, ...args);
  }

  static error(message, err = null) {
    console.error(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.red}[NOCALIA/ERROR]${colors.reset} ${message}`);
    if (err) {
      console.error(err.stack || err);
    }
  }

  static debug(message, ...args) {
    if (process.env.DEBUG === "true") {
      console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.purple}[NOCALIA/DEBUG]${colors.reset} ${message}`, ...args);
    }
  }
}

module.exports = Logger;
