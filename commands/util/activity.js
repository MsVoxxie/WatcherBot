const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { dateToRelative } = require('../../functions/helpers/dateFormatters');
const watchedUsers = require('../../models/watchedUsers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('activity')
		.setDescription('Check the activity of a user')
		.addUserOption((option) => option.setName('user').setDescription('The user to check').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Declarations
		const checkedUser = interaction.options.getUser('user');
		const checkedMember = interaction.guild.members.cache.get(checkedUser.id);

		// Fetch oldest members from database
		if (!inactiveUser.length) return interaction.reply('User has not been tracked yet.');
		const inactiveUser = await watchedUsers.find({ guildId: interaction.guild.id, userId: checkedUser.id });

		// Create the embed
		const embed = new EmbedBuilder()
			.setTitle('User Activity')
			.setDescription(`${checkedMember ? checkedMember : `<@${checkedUser.id}>`}'s Latest Activity`)
			.setColor(client.color)
			.setTimestamp()
			.addFields({ name: 'Last Interaction', value: dateToRelative(inactiveUser[0].lastInteraction) }, { name: 'Last Action', value: inactiveUser[0].lastAction });

		// Send the embed
		return interaction.reply({ embeds: [embed] });
	},
};
