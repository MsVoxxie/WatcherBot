const { Events } = require('discord.js');
const checkAddUpdate = require('../../functions/helpers/checkAddUpdate');

module.exports = {
	name: Events.VoiceStateUpdate,
	runType: 'infinity',
	async execute(client, oldState, newState) {
		// Declarations
		const userId = oldState.id || newState.id;
		const guildId = oldState.guild.id || newState.guild.id;
		const curGuild = client.guilds.cache.get(guildId);
		const member = await curGuild.members.cache.get(userId);
		if (member && member.bot) return;

		// Setup Channel Strings
		if (oldState && oldState.channel && oldState.channel.parent && oldState.channel.parent.name) oldParentName = oldState.channel.parent.name;
		if (oldState && oldState.channel && oldState.channel.name) oldChannelName = oldState.channel.name;
		if (oldState && oldState.channelId) oldChannelId = oldState.channelId;

		if (newState && newState.channel && newState.channel.parent && newState.channel.parent.name) newParentName = newState.channel.parent.name;
		if (newState && newState.channel && newState.channel.name) newChannelName = newState.channel.name;
		if (newState && newState.channelId) newChannelId = newState.channelId;

		// Joined Voice Channel
		if (!oldState.channelId && newState.channel.id && !oldState.channel && newState.channel) {
			// Database Entry
			await checkAddUpdate(curGuild, member, 'Joined Voice Channel');
		}

		//Left Voice Channel
		if (oldState.channelId && !newState.channelId && oldState.channel && !newState.channel) {
			// Database Entry
			await checkAddUpdate(curGuild, member, 'Left Voice Channel');
		}

		//Switched Voice Channel
		if (oldState.channelId && newState.channelId && oldState.channel && newState.channel) {
			// False positive check
			if (oldState.channelId === newState.channelId) return;

			// Database Entry
			await checkAddUpdate(curGuild, member, 'Switched Voice Channel');
		}
	},
};
