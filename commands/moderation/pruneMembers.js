const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const watchedUsers = require('../../models/watchedUsers');
const moment = require('moment');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('prune_members')
		.setDescription('Prune members from the server based on inactivity')
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
		// Confirm that I have the correct permissions
		if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
			return interaction.reply('I do not have the required permissions to kick members.');
		}

		// Declarations
		const time = interaction.options.getString('time');

		// Fetch inactive members from database
		const inactiveUsers = await watchedUsers.find({ guildId: interaction.guild.id });
		if (!inactiveUsers.length) return interaction.reply('No inactive users found.');

		// Grab all the members in the guild
		const members = await interaction.guild.members.fetch();

		// Filter out the members that are inactive
		const inactiveMembers = inactiveUsers.filter((user) => {
			const timeValue = parseInt(time.slice(0, -1), 10);
			const timeUnit = time.slice(-1);
			const duration = moment.duration(timeValue, timeUnit);
			return moment(user.lastInteraction).isBefore(moment().subtract(duration));
		});
		if (!inactiveMembers.length) return interaction.reply({ content: 'No inactive members found within the timeframe provided.', ephemeral: true });

		// Create confirmation embed
		const embed = new EmbedBuilder()
			.setTitle('Prune Members')
			.setDescription(`Are you sure you want to prune **${inactiveMembers.length}** members?`)
			.setColor(client.color)
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
					for (const mem of inactiveMembers) {
						const member = members.get(mem.userId);
						console.log(`Kicking ${member.user.username} for being inactive.\nLast Active ${moment(mem.lastInteraction).fromNow()}`);
						// Confirm the member exists
						if (!member) continue;
						// Check if the member is kickable
						if (member.kickable) {
							// Kick here!
						}
					}

					// Send confirmation message
					await int.update({ content: `Pruned **${inactiveMembers.length}** members.`, embeds: [] });
					break;
				case 'cancel':
					// Send cancellation message
					await int.update({ content: 'Prune **cancelled**.', embeds: [] });
					break;
			}
		});

		// Handle the collector ending
		collector.on('end', async () => {
			// Update the embed to remove the buttons
			await confirmEmbed.edit({ components: [] });
		});
	},
};
