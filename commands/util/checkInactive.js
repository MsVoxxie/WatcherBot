const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { dateToRelative } = require('../../functions/helpers/dateFormatters');
const watchedUsers = require('../../models/watchedUsers');
const moment = require('moment');

// Allowed time units for custom input
const ALLOWED_UNITS = ['d', 'w', 'm', 'y'];
const MAX_TIME_VALUE = 365; // Max numeric value

/**
 * Parses and validates custom time input
 * @param {string} timeStr - Time string like "2w", "3m", "1y", "5d"
 * @returns {{ valid: boolean, value?: number, unit?: string, error?: string }}
 */
function parseAndValidateTime(timeStr) {
	const normalized = timeStr.toLowerCase().trim();

	// Validate format: must be number followed by unit letter
	const match = normalized.match(/^(\d+)([a-z])$/);
	if (!match) {
		return { valid: false, error: 'Invalid format. Use a number followed by a unit (e.g., `5d`, `2w`, `3m`, `1y`).' };
	}

	const value = parseInt(match[1], 10);
	const unit = match[2];

	if (!ALLOWED_UNITS.includes(unit)) {
		return { valid: false, error: 'Invalid unit. Use `d` (days), `w` (weeks), `m` (months), or `y` (years).' };
	}

	if (value < 1) {
		return { valid: false, error: 'Time value must be at least 1.' };
	}

	if (value > MAX_TIME_VALUE) {
		return { valid: false, error: `Time value cannot exceed ${MAX_TIME_VALUE}.` };
	}

	return { valid: true, value, unit };
}

/**
 * Formats time for human-readable display
 * @param {number} value - Numeric value
 * @param {string} unit - Unit character
 * @returns {string}
 */
function formatHumanTime(value, unit) {
	const humanUnitMap = { d: 'day', w: 'week', m: 'month', y: 'year' };
	return `${value} ${humanUnitMap[unit]}${value > 1 ? 's' : ''}`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inactive')
		.setDescription('Find the most inactive members in the server')
		.addStringOption((option) =>
			option
				.setName('time')
				.setDescription('Inactivity period (e.g., 5d, 2w, 3m, 1y). Units: d=days, w=weeks, m=months, y=years')
				.setRequired(true)
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

		// Parse and validate the time input
		const timeResult = parseAndValidateTime(time);
		if (!timeResult.valid) {
			return interaction.followUp({
				content: `⚠️ **Invalid Time Input**\n${timeResult.error}\n\n**Examples:** \`5d\` (5 days), \`2w\` (2 weeks), \`3m\` (3 months), \`1y\` (1 year)`,
				ephemeral: true,
			});
		}

		const { value: timeValue, unit: timeUnit } = timeResult;
		const humanTime = formatHumanTime(timeValue, timeUnit);

		// Fetch oldest members from database
		const inactiveUsers = await watchedUsers.find({ guildId: interaction.guild.id }).sort({ lastInteraction: 1 });
		if (!inactiveUsers.length) return interaction.followUp('No inactive users found.');

		// Filter out the inactive members
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
			.setDescription(`The following members have been inactive for **${humanTime}**`)
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
