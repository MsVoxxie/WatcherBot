const { Events } = require('discord.js');
const watchedUsers = require('../../models/watchedUsers');

module.exports = {
	name: Events.GuildDelete,
	runType: 'infinity',
	async execute(client, guild) {
		// Log the guild leave
		console.log(`Left guild ${guild.name}`);

		// Wait 5 seconds before continuing
		await new Promise((resolve) => setTimeout(resolve, 5000));

		// Remove all guild entries from the database when the bot leaves a guild
		await watchedUsers.deleteMany({ guildId: guild.id }).then((ins) => {
			console.log(`Removed ${ins.deletedCount} members from guild ${guild.name} from the database`);
		});
	},
};
