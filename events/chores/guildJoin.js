const { Events } = require('discord.js');
const watchedUsers = require('../../models/watchedUsers');

module.exports = {
	name: Events.GuildCreate,
	runType: 'infinity',
	async execute(client, guild) {
		// Log the guild join
		console.log(`Joined guild ${guild.name}`);

		// Wait 5 seconds before continuing
		await new Promise((resolve) => setTimeout(resolve, 5000));

		// Cache all members in the guild on join with current date as a baseline
		const members = await guild.members.fetch({ force: true });

		// Add all members to the database at once
		const memberData = [];
		for await (const mem of members) {
			const member = mem[1];
			// Ignore bots
			if (member.user.bot) continue;
			// Add the user to the database
			memberData.push({
				guildId: guild.id,
				userId: member.id,
				lastInteraction: Date.now(),
				lastAction: 'Initial Cache',
			});
		}
		await watchedUsers.insertMany(memberData).then(() => {
			console.log(`Added all members in guild ${guild.name} to the database`);
		});
	},
};
