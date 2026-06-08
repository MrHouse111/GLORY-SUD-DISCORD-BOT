const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../utils/config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('postavi-duznost')
		.setDescription('Postavlja panel za prijavu/odjavu sa dužnosti'),
	async execute(interaction) {
        if (!interaction.member) return interaction.reply({ content: '❌ Ove komande se mogu koristiti isključivo na serveru, a ne u privatnim porukama!', ephemeral: true });
		const hasRole = interaction.member.roles.cache.some(role => config.ALLOWED_ROLES.includes(role.name.toLowerCase()));
		const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
		if (!hasRole && !isAdmin) {
			return interaction.reply({ content: `❌ Samo uprava i administratori mogu koristiti ovu komandu!`, ephemeral: true });
		}
		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(`${config.ORG_NAME} - Evidencija Dužnosti`)
			.setDescription('Kliknite na odgovarajuće dugme ispod kako biste se prijavili ili odjavili sa dužnosti.\n\nZloupotreba ovog sistema strogo je kažnjiva.');

		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('duty_on')
					.setLabel('🟢 Prijava na dužnost')
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId('duty_off')
					.setLabel('🔴 Odjava sa dužnosti')
					.setStyle(ButtonStyle.Danger),
			);

		await interaction.reply({ content: 'Panel je uspešno postavljen. NAPOMENA: Ova komanda se koristi isključivo jednokratno prilikom postavljanja panela.', ephemeral: true });
		await interaction.channel.send({ embeds: [embed], components: [row] });
	},
};
