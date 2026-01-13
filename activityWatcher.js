// Configuration File
const dotenv = require('dotenv');
dotenv.config();

// Discord Classes
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const cron = require('node-cron');

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
	partials: [Partials.Message, Partials.Reaction, Partials.User],
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

// Every 30 minutes
cron.schedule('*/30 * * * *', async () => {
	client.emit('updateActivity');
});
