const { Events } = require('discord.js');
const checkAddUpdate = require('../../functions/helpers/checkAddUpdate');

module.exports = {
	name: Events.MessageUpdate,
	runType: 'infinity',
	async execute(client, message, newMessage) {
		// Check if the message author is a bot
		if (message.author.bot) return;

		// Run the checkAddUpdate function
		await checkAddUpdate(newMessage.guild, newMessage.member, 'Updated Message');
	},
};
