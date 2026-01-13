const { Events } = require('discord.js');
const checkAddUpdate = require('../../functions/helpers/checkAddUpdate');

module.exports = {
	name: Events.MessageReactionAdd,
	runType: 'infinity',
	async execute(client, reaction, user) {
		// Check if the user who reacted is a bot
		if (user.bot) return;

		// Fetch partial reaction/message if not cached
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (error) {
				return console.error('Failed to fetch reaction:', error);
			}
		}
		if (reaction.message.partial) {
			try {
				await reaction.message.fetch();
			} catch (error) {
				return console.error('Failed to fetch message:', error);
			}
		}

		// Get the member who reacted (not the message author)
		const member = await reaction.message.guild.members.fetch(user.id);

		// Run the checkAddUpdate function
		await checkAddUpdate(reaction.message.guild, member, 'Added Reaction', reaction.message.url);
	},
};
