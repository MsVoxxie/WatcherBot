const { ActivityType } = require('discord.js');
const watchedUsers = require('../../models/watchedUsers');

module.exports = {
	name: 'updateActivity',
	runType: 'single',
	async execute(client) {
		// Set presence
		const countedMembers = await watchedUsers.find({}).countDocuments();
		const totalMembers = countedMembers.toLocaleString('en-US');
		client.user.setActivity(`${totalMembers} members`, { type: ActivityType.Watching });
	},
};
