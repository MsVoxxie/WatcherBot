const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { dateToRelative } = require('../../functions/helpers/dateFormatters');
const watchedUsers = require('../../models/watchedUsers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inactive')
		.setDescription('Find the most inactive members in the server')
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Fetch oldest members from database
		const inactiveUsers = await watchedUsers.find({ guildId: interaction.guild.id }).sort({ lastInteraction: 1 }).limit(25);
		if (!inactiveUsers.length) return interaction.reply('No inactive users found.');

		// Create the embed
		const embed = new EmbedBuilder()
			.setTitle('Inactive Users')
			.setColor(client.color)
			.setTimestamp()
			.addFields({
				name: 'Most Inactive Users',
				value: inactiveUsers
					.map((user) => {
						const member = interaction.guild.members.cache.get(user.userId);
						return `${member ? member : `<@${user.userId}`} **-** ${dateToRelative(user.lastInteraction)}`;
					})
					.join('\n'),
			});

		// Send the embed
		return interaction.reply({ embeds: [embed] });
	},
};
