const { Events } = require('discord.js');
const checkAddUpdate = require('../../functions/helpers/checkAddUpdate');

module.exports = {
	name: Events.GuildMemberAdd,
	runType: 'infinity',
	async execute(client, member) {
		// Add the user to the database when they join the guild
		await checkAddUpdate(member.guild, member, 'Joined Guild');
	},
};
