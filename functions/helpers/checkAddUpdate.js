const watchedUsers = require('../../models/watchedUsers');

async function checkAddUpdate(guild, member, action) {
	// Check if the user is already being watched in the guild
	const user = await watchedUsers.findOne({
		guildId: guild.id,
		userId: member.id,
	});

	// If the user is not being watched, add them to the database
	if (!user) {
		await watchedUsers.create({
			guildId: guild.id,
			userId: member.id,
			lastInteraction: Date.now(),
			lastAction: action,
		});
	}

	// If the user is being watched, update their last interaction
	else {
		await watchedUsers.findOneAndUpdate(
			{
				guildId: guild.id,
				userId: member.id,
			},
			{
				lastInteraction: Date.now(),
				lastAction: action,
			}
		);
	}
}

module.exports = checkAddUpdate;
