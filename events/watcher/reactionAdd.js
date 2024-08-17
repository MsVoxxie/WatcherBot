const { Events } = require('discord.js');
const checkAddUpdate = require('../../functions/helpers/checkAddUpdate');

module.exports = {
	name: Events.MessageReactionAdd,
	runType: 'infinity',
	async execute(client, reaction, user) {
		// Check if the message author is a bot
		if (reaction.message.author.bot) return;

		// Run the checkAddUpdate function
		await checkAddUpdate(reaction.message.guild, reaction.message.member, 'Added Reaction');
	},
};
