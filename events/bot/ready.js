const { Events, ActivityType } = require('discord.js');
const Logger = require('../../functions/logging/logger');
const watchedUsers = require('../../models/watchedUsers');

module.exports = {
	name: Events.ClientReady,
	runType: 'single',
	async execute(client) {
		Logger.success(`Ready! Logged in as ${client.user.tag}`);
		client.mongoose.init();

		// First startup set presence
		const countedMembers = await watchedUsers.find({}).countDocuments();
		const totalMembers = countedMembers.toLocaleString('en-US');
		client.user.setActivity(`${totalMembers} members`, { type: ActivityType.Watching });
	},
};
