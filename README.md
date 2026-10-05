# ✨ Aura • Nocalia Discord Bot

Official, modern Discord application built specifically for the **Nocalia Theme Park Network** using **Node.js** and **Discord.js v14**. Fully autonomous with zero external database dependencies.

---

## ✨ Features

- **🏰 Server & Attraction Network (`/ip`, `/status`)**: Real-time Minecraft Java & Bedrock status, live player counts, latency checks, and connection addresses.
- **🎧 Live Audio Portal Integration (`/audio`)**: Direct link and quick guide for the real-time synchronized attraction audio portal (`nocaliamc.com/audio`).
- **🎫 Interactive Ticket Hub (`/tickets`, `/add`, `/remove`)**:
  - Modal-based support forms (with strict 1000-character limits to prevent Discord API payload issues).
  - Dynamic categories: General Support, Crew Recruitment, Bug Reports & Infractions, Media & Partnerships.
  - Interactive recruitment evaluation (`Accept` / `Reject` buttons with feedback modals).
  - Standalone conversation transcripts (`discord-html-transcripts`) delivered to staff log channels and user DMs upon ticket closure.
- **🛡️ Community Moderation (`/kick`, `/ban`, `/unban`, `/timeout`, `/clear`)**: Native Discord permission gates, detailed audit embeds, and role hierarchy protections.
- **🎉 Community Giveaways (`/giveaway`, `/reroll`)**: Interactive button entries (`Enter Giveaway`), dynamic Discord timestamps (`<t:TIMESTAMP:R>`), live participant counts, and automated winner picking.

---

## 📁 Clean Modular Architecture

```
Nocalia-Bot/
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── index.js                      # Clean application entrypoint
    ├── config/
    │   └── config.json               # Nocalia theme colors, tickets & server configs
    ├── structures/
    │   ├── NocaliaClient.js          # Extended Client holding collections & services
    │   ├── MinecraftService.js       # Java/Bedrock ping with 30s smart cache
    │   ├── TicketService.js          # Ticket lifecycle, modals, transcripts & cleanup
    │   └── Logger.js                 # Formatted console logger with timestamps
    ├── handlers/
    │   ├── commandHandler.js         # Auto-discovers slash commands & registers via REST
    │   └── eventHandler.js           # Auto-discovers and registers event listeners
    ├── events/
    │   ├── client/
    │   │   ├── ready.js              # ClientReady event, presence & slash command deployment
    │   │   └── interactionCreate.js  # Dispatcher for commands, selects, modals, and buttons
    │   └── guild/
    │       └── guildMemberAdd.js     # Default role assignment & welcome embeds
    └── commands/
        ├── info/                     # /ip, /status, /audio, /ping
        ├── tickets/                  # /tickets, /add, /remove
        ├── moderation/               # /kick, /ban, /unban, /timeout, /clear
        └── community/                # /giveaway, /reroll
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your values:

```ini
# Discord Application Credentials
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id
GUILD_ID=your_test_guild_id          # (Optional: for instant guild command sync during dev)

# Nocalia Minecraft Network
NOCALIA_MC_HOST=play.nocaliamc.com
NOCALIA_MC_PORT=25565
NOCALIA_BEDROCK_PORT=19132

# Guild Roles & Channels (Optional)
STAFF_ROLE_ID=
DEFAULT_ROLE_ID=
TICKET_LOG_CHANNEL_ID=
WELCOME_CHANNEL_ID=
```

### 3. Run the Bot
- **Development (hot-reload)**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```

---

## 🔒 Discord Developer Portal Checklist
Ensure the following are toggled in your Discord Application settings:
- **Privileged Gateway Intents**:
  - `Server Members Intent` (GuildMembers)
  - `Message Content Intent` (MessageContent)
- **Bot Permissions**:
  - `Manage Channels`, `Manage Roles`, `View Channels`, `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`.
