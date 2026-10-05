require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../src/config/config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function main() {
  const token = process.env.DISCORD_TOKEN;
  const guildId = process.env.GUILD_ID;
  const crewRoleId = process.env.STAFF_ROLE_ID;

  if (!token || !guildId) {
    console.error("❌ DISCORD_TOKEN or GUILD_ID is missing in .env!");
    process.exit(1);
  }

  console.log("Connecting to Discord with Aura...");
  await client.login(token);

  console.log(`Logged in as ${client.user.tag}!`);
  let guild = await client.guilds.fetch(guildId).catch(() => null);

  if (!guild) {
    console.error(`❌ Guild with ID ${guildId} not found! Make sure Aura is invited to your server.`);
    process.exit(1);
  }

  // Fetch full guild structure with roles and channels
  guild = await guild.fetch();
  console.log(`Found guild: "${guild.name}" (${guild.id})`);
  console.log("Creating full Nocalia channel architecture...");

  const everyoneRoleId = guild.roles?.everyone?.id || guild.id;
  const botMember = await guild.members.fetchMe();

  let welcomeChannelId = null;
  let ticketLogChannelId = null;
  let ticketPanelChannel = null;
  let supportCategoryId = null;

  // 1. WELCOME & INFO CATEGORY
  console.log("Creating: 🏰 WELCOME & INFO...");
  const welcomeCategory = await guild.channels.create({
    name: "╭── 🏰 WELCOME & INFO ──╮",
    type: ChannelType.GuildCategory
  });

  const welcomeChan = await guild.channels.create({
    name: "│✨・welcome",
    type: ChannelType.GuildText,
    parent: welcomeCategory.id
  });
  welcomeChannelId = welcomeChan.id;

  await guild.channels.create({
    name: "│📜・rules",
    type: ChannelType.GuildText,
    parent: welcomeCategory.id,
    permissionOverwrites: [
      { id: everyoneRoleId, deny: [PermissionFlagsBits.SendMessages] }
    ]
  });

  const linksChan = await guild.channels.create({
    name: "│🌐・official-links",
    type: ChannelType.GuildText,
    parent: welcomeCategory.id,
    permissionOverwrites: [
      { id: everyoneRoleId, deny: [PermissionFlagsBits.SendMessages] }
    ]
  });

  await guild.channels.create({
    name: "│📌・role-picker",
    type: ChannelType.GuildText,
    parent: welcomeCategory.id,
    permissionOverwrites: [
      { id: everyoneRoleId, deny: [PermissionFlagsBits.SendMessages] }
    ]
  });

  // Post official links embed
  const linksEmbed = new EmbedBuilder()
    .setColor(config.theme.primaryColor)
    .setTitle(`🏰 Welcome to ${config.theme.networkTitle}!`)
    .setDescription(
      "Step into a world of handcrafted attractions, breathtaking night shows, and cutting-edge live synchronized audio!\n\n" +
      "### ☕ Server Connection\n" +
      `• **Java Edition (PC / Mac):** \`${config.minecraft.defaultHost}\`\n` +
      `• **Bedrock Edition (Mobile / Console / Win10):** \`${config.minecraft.defaultHost}\` (Port: \`${config.minecraft.bedrockPort}\`)\n` +
      "• **Supported Versions:** 1.20 – 1.21.x\n\n" +
      "### 🎧 Live Spatial Audio Portal\n" +
      "Listen to in-ride soundtracks live in your web browser:\n" +
      `👉 **[nocaliamc.com/audio](${config.theme.audioPortalUrl})**\n\n` +
      "### 🌐 Official Website\n" +
      `👉 **[nocaliamc.com](${config.theme.websiteUrl})**`
    )
    .setFooter({ text: config.theme.footerText, iconURL: client.user.displayAvatarURL() })
    .setTimestamp();

  await linksChan.send({ embeds: [linksEmbed] }).catch(() => null);

  // 2. PARK NEWS & EVENTS CATEGORY
  console.log("Creating: 📢 PARK NEWS & EVENTS...");
  const newsCategory = await guild.channels.create({
    name: "╭── 📢 PARK NEWS & EVENTS ──╮",
    type: ChannelType.GuildCategory
  });

  await guild.channels.create({
    name: "│📢・announcements",
    type: ChannelType.GuildText,
    parent: newsCategory.id,
    permissionOverwrites: [
      { id: everyoneRoleId, deny: [PermissionFlagsBits.SendMessages] }
    ]
  });

  await guild.channels.create({
    name: "│🎢・park-updates",
    type: ChannelType.GuildText,
    parent: newsCategory.id,
    permissionOverwrites: [
      { id: everyoneRoleId, deny: [PermissionFlagsBits.SendMessages] }
    ]
  });

  await guild.channels.create({
    name: "│✨・shows-and-events",
    type: ChannelType.GuildText,
    parent: newsCategory.id,
    permissionOverwrites: [
      { id: everyoneRoleId, deny: [PermissionFlagsBits.SendMessages] }
    ]
  });

  await guild.channels.create({
    name: "│🎉・giveaways",
    type: ChannelType.GuildText,
    parent: newsCategory.id,
    permissionOverwrites: [
      { id: everyoneRoleId, deny: [PermissionFlagsBits.SendMessages] }
    ]
  });

  // 3. PARK SQUARE (COMMUNITY)
  console.log("Creating: 💬 PARK SQUARE (COMMUNITY)...");
  const communityCategory = await guild.channels.create({
    name: "╭── 💬 PARK SQUARE (COMMUNITY) ──╮",
    type: ChannelType.GuildCategory
  });

  await guild.channels.create({
    name: "│☕・general-chat",
    type: ChannelType.GuildText,
    parent: communityCategory.id
  });

  await guild.channels.create({
    name: "│📸・park-photos",
    type: ChannelType.GuildText,
    parent: communityCategory.id
  });

  await guild.channels.create({
    name: "│💡・ideas-and-feedback",
    type: ChannelType.GuildText,
    parent: communityCategory.id
  });

  await guild.channels.create({
    name: "│🤖・bot-commands",
    type: ChannelType.GuildText,
    parent: communityCategory.id
  });

  // 4. GUEST RELATIONS & SUPPORT
  console.log("Creating: 🎫 GUEST RELATIONS & SUPPORT...");
  const supportCategory = await guild.channels.create({
    name: "╭── 🎫 GUEST RELATIONS ──╮",
    type: ChannelType.GuildCategory
  });
  supportCategoryId = supportCategory.id;

  ticketPanelChannel = await guild.channels.create({
    name: "│🎫・open-a-ticket",
    type: ChannelType.GuildText,
    parent: supportCategory.id,
    permissionOverwrites: [
      { id: everyoneRoleId, deny: [PermissionFlagsBits.SendMessages] }
    ]
  });

  // Permissions for private archives
  const archivePermissions = [
    { id: everyoneRoleId, deny: [PermissionFlagsBits.ViewChannel] },
    { id: botMember.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
  ];
  if (crewRoleId && guild.roles.cache.has(crewRoleId)) {
    archivePermissions.push({ id: crewRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] });
  }

  const archiveChan = await guild.channels.create({
    name: "│📂・ticket-archives",
    type: ChannelType.GuildText,
    parent: supportCategory.id,
    permissionOverwrites: archivePermissions
  });
  ticketLogChannelId = archiveChan.id;

  // Deploy interactive ticket panel
  const selectOptions = config.tickets.categories.map((cat) => {
    const opt = new StringSelectMenuOptionBuilder()
      .setValue(cat.id)
      .setLabel(cat.label)
      .setDescription(cat.description.substring(0, 100));
    if (cat.emoji) opt.setEmoji(cat.emoji);
    return opt;
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("nocalia_select_ticket_cat")
    .setPlaceholder("👉 Select an inquiry category to open a ticket...")
    .addOptions(selectOptions);

  const row = new ActionRowBuilder().addComponents(menu);

  const ticketEmbed = new EmbedBuilder()
    .setColor(config.theme.primaryColor)
    .setTitle(`🏰 ${config.theme.networkTitle} • Support & Inquiries`)
    .setDescription(
      "Welcome to the official **Nocalia Help Desk**!\n\n" +
      "Whether you need assistance with an attraction, wish to join our Crew, " +
      "report a bug or player infraction, or propose a media partnership, our team is here for you.\n\n" +
      "**How it works:**\n" +
      "1. Select the relevant category from the menu below.\n" +
      "2. Fill in the short interactive modal form.\n" +
      "3. A private ticket channel will be created instantly for you and the Crew!"
    )
    .addFields(
      {
        name: "📌 Guidelines",
        value:
          "• Please explain your request clearly.\n" +
          "• Attach any relevant screenshots, clips, or error logs.\n" +
          "• Please avoid opening duplicate tickets for the same topic.",
        inline: false
      }
    )
    .setFooter({ text: config.theme.footerText, iconURL: client.user.displayAvatarURL() });

  await ticketPanelChannel.send({ embeds: [ticketEmbed], components: [row] });

  // 5. LOUNGES & AUDIO
  console.log("Creating: 🔊 LOUNGES & AUDIO...");
  const voiceCategory = await guild.channels.create({
    name: "╭── 🔊 LOUNGES & AUDIO ──╮",
    type: ChannelType.GuildCategory
  });

  await guild.channels.create({
    name: "🔊・Main Plaza",
    type: ChannelType.GuildVoice,
    parent: voiceCategory.id
  });

  await guild.channels.create({
    name: "🔊・Park Stroll",
    type: ChannelType.GuildVoice,
    parent: voiceCategory.id
  });

  await guild.channels.create({
    name: "🔊・Audio Studio",
    type: ChannelType.GuildVoice,
    parent: voiceCategory.id
  });

  // 6. BACKSTAGE (STAFF ONLY)
  console.log("Creating: 🔒 BACKSTAGE (STAFF ONLY)...");
  const backstagePermissions = [
    { id: everyoneRoleId, deny: [PermissionFlagsBits.ViewChannel] },
    { id: botMember.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
  ];
  if (crewRoleId && guild.roles.cache.has(crewRoleId)) {
    backstagePermissions.push({ id: crewRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] });
  }

  const backstageCategory = await guild.channels.create({
    name: "╭── 🔒 BACKSTAGE (CREW ONLY) ──╮",
    type: ChannelType.GuildCategory,
    permissionOverwrites: backstagePermissions
  });

  await guild.channels.create({
    name: "│📋・crew-announcements",
    type: ChannelType.GuildText,
    parent: backstageCategory.id
  });

  await guild.channels.create({
    name: "│💬・crew-lounge",
    type: ChannelType.GuildText,
    parent: backstageCategory.id
  });

  await guild.channels.create({
    name: "│🛠️・development-and-builds",
    type: ChannelType.GuildText,
    parent: backstageCategory.id
  });

  await guild.channels.create({
    name: "│🛡️・moderation-logs",
    type: ChannelType.GuildText,
    parent: backstageCategory.id
  });

  await guild.channels.create({
    name: "🔊・Crew Briefing Room",
    type: ChannelType.GuildVoice,
    parent: backstageCategory.id
  });

  // Update .env with channel IDs
  console.log("Saving channel IDs to .env...");
  let envContent = fs.readFileSync(path.join(__dirname, "../.env"), "utf8");
  envContent = envContent.replace(/WELCOME_CHANNEL_ID=.*/, `WELCOME_CHANNEL_ID=${welcomeChannelId}`);
  envContent = envContent.replace(/TICKET_LOG_CHANNEL_ID=.*/, `TICKET_LOG_CHANNEL_ID=${ticketLogChannelId}`);
  fs.writeFileSync(path.join(__dirname, "../.env"), envContent);

  // Update ticket categories parent ID in config.json
  const configPath = path.join(__dirname, "../src/config/config.json");
  const currentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  for (const cat of currentConfig.tickets.categories) {
    cat.categoryId = supportCategoryId;
    if (crewRoleId) cat.allowedRoles = [crewRoleId];
  }
  fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));

  console.log("🎉 Complete Nocalia Discord architecture created successfully!");
  console.log(`• Welcome Channel: ${welcomeChannelId}`);
  console.log(`• Ticket Archive Channel: ${ticketLogChannelId}`);
  console.log(`• Ticket Panel deployed in: ${ticketPanelChannel.id}`);

  client.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal error during guild setup:", err);
  process.exit(1);
});
