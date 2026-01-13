const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const watchedUsers = require('../../models/watchedUsers');
const moment = require('moment');

// Safeguard constants
const SAFEGUARDS = {
	MIN_DAYS: 7, // Minimum 1 week of inactivity required
	MAX_PRUNE_PERCENTAGE: 50, // Cannot prune more than 50% of guild at once
	MAX_TIME_VALUE: 52, // Maximum numeric value (e.g., 52 weeks)
	ALLOWED_UNITS: ['w', 'm', 'y'], // Only weeks, months, years allowed (no days for safety)
};

/**
 * Parses and validates custom time input
 * @param {string} timeStr - Time string like "2w", "3m", "1y"
 * @returns {{ valid: boolean, value?: number, unit?: string, error?: string, days?: number }}
 */
function parseAndValidateTime(timeStr) {
	// Normalize input
	const normalized = timeStr.toLowerCase().trim();

	// Validate format: must be number followed by unit letter
	const match = normalized.match(/^(\d+)([a-z])$/);
	if (!match) {
		return { valid: false, error: 'Invalid format. Use a number followed by a unit (e.g., `2w`, `3m`, `1y`).' };
	}

	const value = parseInt(match[1], 10);
	const unit = match[2];

	// Validate unit
	if (!SAFEGUARDS.ALLOWED_UNITS.includes(unit)) {
		return { valid: false, error: `Invalid time unit. Only \`w\` (weeks), \`m\` (months), and \`y\` (years) are allowed for safety.` };
	}

	// Validate numeric value
	if (value < 1) {
		return { valid: false, error: 'Time value must be at least 1.' };
	}

	if (value > SAFEGUARDS.MAX_TIME_VALUE) {
		return { valid: false, error: `Time value cannot exceed ${SAFEGUARDS.MAX_TIME_VALUE}.` };
	}

	// Calculate equivalent days for minimum threshold check
	const daysMap = { w: 7, m: 30, y: 365 };
	const totalDays = value * daysMap[unit];

	if (totalDays < SAFEGUARDS.MIN_DAYS) {
		return { valid: false, error: `Minimum inactivity period is ${SAFEGUARDS.MIN_DAYS} days (1 week) for safety.` };
	}

	return { valid: true, value, unit, days: totalDays };
}

/**
 * Formats time for human-readable display
 * @param {number} value - Numeric value
 * @param {string} unit - Unit character
 * @returns {string}
 */
function formatHumanTime(value, unit) {
	const humanUnitMap = { w: 'week', m: 'month', y: 'year' };
	return `${value} ${humanUnitMap[unit]}${value > 1 ? 's' : ''}`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('process_members')
		.setDescription('Prune members from the server based on inactivity')
		.addStringOption((option) =>
			option
				.setName('time')
				.setDescription('Inactivity period (e.g., 2w, 3m, 1y). Min: 1 week. Units: w=weeks, m=months, y=years')
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('action')
				.setDescription('The action to take on the inactive members')
				.setRequired(true)
				.addChoices({ name: 'Issue Warning', value: 'warn' }, { name: 'Kick Members', value: 'kick' })
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction) {
		// Confirm that I have the correct permissions
		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
			return interaction.reply({ content: 'I do not have the required permissions to kick members.', ephemeral: true });
		}

		// Declarations
		const time = interaction.options.getString('time');
		const action = interaction.options.getString('action');

		// Parse and validate the time input
		const timeResult = parseAndValidateTime(time);
		if (!timeResult.valid) {
			return interaction.reply({
				content: `⚠️ **Invalid Time Input**\n${timeResult.error}\n\n**Examples:** \`2w\` (2 weeks), \`3m\` (3 months), \`1y\` (1 year)`,
				ephemeral: true,
			});
		}

		const { value: timeValue, unit: timeUnit, days: totalDays } = timeResult;

		// Compute cutoff time for inactivity
		const unitMap = { w: 'weeks', m: 'months', y: 'years' };
		const momentUnit = unitMap[timeUnit];
		const cutoffTime = moment().subtract(timeValue, momentUnit);
		const cutoffMs = cutoffTime.valueOf();

		// Human readable time
		const humanTime = formatHumanTime(timeValue, timeUnit);

		// Grab all the members in the guild
		const members = await interaction.guild.members.fetch();
		const totalMemberCount = members.size;

		// Query DB for users with lastInteraction older than the cutoff (more efficient and accurate)
		const inactiveMembers = await watchedUsers.find({ guildId: interaction.guild.id, lastInteraction: { $lt: cutoffMs } }).sort({ lastInteraction: 1 });

		console.log(`Found ${inactiveMembers.length} inactive members.`);

		if (!inactiveMembers.length) return interaction.reply({ content: 'No inactive members found within the timeframe provided.', ephemeral: true });

		// SAFEGUARD: Check prune percentage
		const prunePercentage = (inactiveMembers.length / totalMemberCount) * 100;
		if (prunePercentage > SAFEGUARDS.MAX_PRUNE_PERCENTAGE) {
			return interaction.reply({
				content: `🛑 **Safety Limit Exceeded**\n\nThis action would affect **${inactiveMembers.length}** members (**${prunePercentage.toFixed(1)}%** of the server).\n\nFor safety, you cannot ${action === 'kick' ? 'kick' : 'process'} more than **${SAFEGUARDS.MAX_PRUNE_PERCENTAGE}%** of the guild at once.\n\n**Suggestion:** Try a shorter inactivity period to reduce the number of affected members.`,
				ephemeral: true,
			});
		}

		// Create confirmation embed with detailed safety information
		const embed = new EmbedBuilder()
			.setTitle('⚠️ Confirm Member Processing')
			.setDescription(
				`Are you sure you want to ***${action === 'warn' ? '__warn__' : '__kick__'}*** **${inactiveMembers.length}** members for being inactive for >**${humanTime}**?`
			)
			.addFields(
				{ name: '📊 Impact Analysis', value: `• **Affected:** ${inactiveMembers.length} / ${totalMemberCount} members\n• **Percentage:** ${prunePercentage.toFixed(1)}% of server\n• **Inactivity Threshold:** ${humanTime} (${totalDays} days)`, inline: false },
				{ name: '🔒 Safety Checks Passed', value: `✅ Minimum period: ${SAFEGUARDS.MIN_DAYS}+ days\n✅ Under ${SAFEGUARDS.MAX_PRUNE_PERCENTAGE}% guild limit\n✅ Valid time format`, inline: false }
			)
			.setColor(action === 'kick' ? 0xff0000 : client.color)
			.setFooter({ text: 'This action will timeout in 2 minutes' })
			.setTimestamp();

		// Create buttons for confirmation
		const buttons = new ActionRowBuilder();
		buttons.addComponents(
			new ButtonBuilder().setLabel('Confirm').setStyle(ButtonStyle.Success).setCustomId('confirm'),
			new ButtonBuilder().setLabel('Cancel').setStyle(ButtonStyle.Danger).setCustomId('cancel')
		);

		// Send the embed
		const confirmEmbed = await interaction.reply({ embeds: [embed], components: [buttons] });

		// Create a filter for the button click
		const filter = (int) => int.user.id === interaction.user.id;
		const collector = await confirmEmbed.createMessageComponentCollector({ filter, time: 120 * 1000, max: 1 });
		collector.on('collect', async (int) => {
			switch (int.customId) {
				case 'confirm':
					// Kick the inactive members
					for await (const mem of inactiveMembers) {
						const member = members.get(mem.userId);

						// Confirm the member exists
						if (!member) continue;

						console.log(`Member: ${member.user.username}`);

						// Wait to prevent rate limiting
						await new Promise((resolve) => setTimeout(resolve, 2500));
						// Issue a warning
						switch (action) {
							case 'warn':
								try {
									console.log(`Warning ${member.user.username} for being inactive.\nLast Active ${moment(mem.lastInteraction).fromNow()}`);
									// await member.send(`You have been inactive for too long in **${interaction.guild.name}** and may be kicked soon.`);
								} catch (error) {
									console.error(`Unable to send warning message to ${member.user.username}`);
								}
								break;
							case 'kick':
								if (member.kickable) {
									// Kick here
									try {
										console.log(`Kicking ${member.user.username} for being inactive.\nLast Active ${moment(mem.lastInteraction).fromNow()}`);
										// await member.kick(`Inactive for too long in ${interaction.guild.name}`);
									} catch (error) {
										console.error(`Unable to kick ${member.user.username}`);
									}
								}
								break;
						}
					}

					// Send confirmation message
					await interaction.followUp({ content: `Pruned **${inactiveMembers.length}** members.`, embeds: [] });
					break;
				case 'cancel':
					// Send cancellation message
					await interaction.followUp({ content: 'Prune **cancelled**.', embeds: [] });
					break;
			}
		});

		// Handle the collector ending
		collector.on('end', async () => {
			const reply = await interaction.fetchReply();
			await reply.delete();
		});
	},
};
