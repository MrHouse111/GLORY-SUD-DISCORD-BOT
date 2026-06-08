const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const statsStore = require('../utils/statsStore');
const config = require('../utils/config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('minus')
		.setDescription('Dodeljuje minus (-) članu')
        .addUserOption(option => 
            option.setName('clan')
                .setDescription('član kom se dodeljuje minus')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('razlog')
                .setDescription('Razlog dodeljivanja minusa')
                .setRequired(true)),
	async execute(interaction) {
        const hasRole = interaction.member.roles.cache.some(role => config.ALLOWED_ROLES.includes(role.name.toLowerCase()));
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        
        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: '❌ Nemate dozvolu! Ovu komandu mogu koristiti samo članovi uprave.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('clan');
        const razlog = interaction.options.getString('razlog');

        statsStore.addMinus(targetUser.id, targetUser.username);

		const embed = new EmbedBuilder()
			.setColor('#ffaa00') // Orange for warning
			.setTitle(`⚠️ ${config.ORG_NAME} | Novi Minus`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: 'Korisnik:', value: `<@${targetUser.id}>`, inline: true },
                { name: 'Dodelio:', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Razlog:', value: razlog, inline: false }
            )
            .setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
