// Configuration File
const dotenv = require('dotenv');
dotenv.config();

// Discord Classes
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// Define Client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessageReactions,
	],
	allowedMentions: { parse: [] },
});

// Define Collections
client.cooldowns = new Collection();
client.commands = new Collection();
client.events = new Collection();

// Client Constants
client.color = '#63e5be';

// Run Loaders
client.mongoose = require('./core/loaders/mongooseLoader');
require('./core/loaders/commandLoader')(client);
require('./core/loaders/eventLoader')(client);

client.login(process.env.DISCORD_TOKEN);
