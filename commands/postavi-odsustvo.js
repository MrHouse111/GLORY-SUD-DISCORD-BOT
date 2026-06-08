const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('postavi-odsustvo')
        .setDescription('Postavlja panel za prijavu odsustva u trenutni kanal.'),
    async execute(interaction) {
        if (!interaction.member) return interaction.reply({ content: '❌ Ove komande se mogu koristiti isključivo na serveru, a ne u privatnim porukama!', ephemeral: true });
        const hasRole = interaction.member.roles.cache.some(role => config.ALLOWED_ROLES.includes(role.name.toLowerCase()));
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: '❌ Samo uprava i administratori mogu koristiti ovu komandu!', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle(`${config.ORG_NAME} - Prijava Odsustva`)
            .setDescription('Ukoliko ste sprečeni da prisustvujete dužnosti ili sastanku, kliknite na dugme ispod kako biste popunili formular za odsustvo.\n\nSvako neopravdano odsustvo duže od 48h rezultiraće otkazom.')
            .setTimestamp()
            .setFooter({ text: `${config.ORG_NAME} Uprava` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('odsustvo_btn')
                    .setLabel('📝 Prijavi Odsustvo')
                    .setStyle(ButtonStyle.Primary),
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Panel je uspešno postavljen. NAPOMENA: Ova komanda se koristi isključivo jednokratno prilikom postavljanja panela.', ephemeral: true });
    },
};
