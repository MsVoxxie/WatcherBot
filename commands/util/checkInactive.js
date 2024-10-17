const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { dateToRelative } = require('../../functions/helpers/dateFormatters');
const watchedUsers = require('../../models/watchedUsers');
const moment = require('moment');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inactive')
		.setDescription('Find the most inactive members in the server')
		.addStringOption((option) =>
			option
				.setName('time')
				.setDescription('The time a user must be inactive to be pruned')
				.setRequired(true)
				.addChoices({ name: 'One Day', value: '1d' }, { name: 'One Week', value: '1w' }, { name: 'One Month', value: '1m' }, { name: 'One Year', value: '1y' })
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defers the response
		await interaction.deferReply();

		// Declarations
		const time = interaction.options.getString('time');

		// Reverse lookup for the time
		const timeLookup = {
			'1d': 'One Day',
			'1w': 'One Week',
			'1m': 'One Month',
			'1y': 'One Year',
		};
		const timeString = timeLookup[time];

		// Fetch oldest members from database
		const inactiveUsers = await watchedUsers.find({ guildId: interaction.guild.id }).sort({ lastInteraction: 1 });
		if (!inactiveUsers.length) return interaction.followUp('No inactive users found.');

		// Filter out the inactive members
		const timeValue = parseInt(time.slice(0, -1), 10);
		const timeUnit = time.slice(-1);
		const unitMap = { d: 'days', w: 'weeks', m: 'months', y: 'years' };
		const momentUnit = unitMap[timeUnit];
		const cutoffTime = moment().subtract(timeValue, momentUnit);
		const inactiveMembers = inactiveUsers.filter((user) => {
			const lastInteraction = moment(user.lastInteraction);
			return lastInteraction.isValid() && lastInteraction.isBefore(cutoffTime);
		});

		console.log(`Found ${inactiveMembers.length} inactive members.`);

		if (!inactiveMembers.length) return interaction.followUp({ content: 'No inactive members found within the timeframe provided.', ephemeral: true });

		// Limit to 10 users
		const tenInactiveUsers = inactiveMembers.splice(0, 10);
		// Total guild members formatted with LocaleString
		const totalGuildMembers = interaction.guild.members.cache.size.toLocaleString();

		// Create the embed
		const embed = new EmbedBuilder()
			.setTitle(`${interaction.guild.name}'s 10 Most Inactive Members`)
			.setColor(client.color)
			.setFooter({ text: `Total Inactive Members: ${inactiveMembers.length} / ${totalGuildMembers}` })
			.setTimestamp()
			.setDescription(`The following members have been inactive for **${timeString}**`)
			.addFields({
				name: 'Members',
				value: tenInactiveUsers
					.map((user) => {
						const member = interaction.guild.members.cache.get(user.userId);
						return `${member ? member : `<@${user.userId}`} **-** ${dateToRelative(user.lastInteraction)}`;
					})
					.join('\n'),
			});

		// Send the embed
		return interaction.followUp({ embeds: [embed] });
	},
};
