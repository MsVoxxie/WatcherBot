const { Events } = require('discord.js');
const watchedUsers = require('../../models/watchedUsers');

module.exports = {
	name: Events.GuildMemberRemove,
	runType: 'infinity',
	async execute(client, member) {
		// Remove the user from the database when they leave the guild
		await watchedUsers.findOneAndDelete({
			guildId: member.guild.id,
			userId: member.id,
		});
	},
};
