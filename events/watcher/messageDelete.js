const { Events } = require('discord.js');
const checkAddUpdate = require('../../functions/helpers/checkAddUpdate');

module.exports = {
	name: Events.MessageDelete,
	runType: 'infinity',
	async execute(client, message) {
		// Check if the message author is a bot
		if (message.author.bot) return;

		// Run the checkAddUpdate function (channel URL since message is deleted)
		const channelUrl = `https://discord.com/channels/${message.guild.id}/${message.channel.id}`;
		await checkAddUpdate(message.guild, message.member, 'Deleted Message', channelUrl);
	},
};
