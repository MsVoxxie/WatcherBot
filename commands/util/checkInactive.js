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
		const inactiveUsers = await watchedUsers.find({ guildId: interaction.guild.id }).sort({ lastInteraction: 1 });
		if (!inactiveUsers.length) return interaction.reply('No inactive users found.');

		// Limit to 10 users
		const tenInactiveUsers = inactiveUsers.splice(0, 10);

		// Total guild members formatted with LocaleString
		const totalGuildMembers = interaction.guild.members.cache.size.toLocaleString();

		// Create the embed
		const embed = new EmbedBuilder()
			.setTitle(`${interaction.guild.name}'s 10 Most Inactive Users`)
			.setColor(client.color)
			.setFooter({ text: `Total Inactive Users: ${inactiveUsers.length} / ${totalGuildMembers}` })
			.setTimestamp()
			.addFields({
				name: 'Users',
				value: tenInactiveUsers
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
