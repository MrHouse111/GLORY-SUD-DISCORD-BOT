const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('postavi-tiketi')
        .setDescription('Postavlja panel za otvaranje tiketa (podrške).'),
    async execute(interaction) {
        if (!interaction.member) return interaction.reply({ content: '❌ Ove komande se mogu koristiti isključivo na serveru, a ne u privatnim porukama!', ephemeral: true });
        const hasRole = interaction.member.roles.cache.some(role => config.ALLOWED_ROLES.includes(role.name.toLowerCase()));
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: '❌ Samo uprava i administratori mogu koristiti ovu komandu!', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setColor('#2ecc71') // Zelena boja za podršku
            .setTitle(`📞 ${config.ORG_NAME} Centar za Podršku`)
            .setDescription('Ukoliko imate problem, žalbu ili pitanje za Upravu, kliknite na dugme ispod kako biste otvorili privatni tiket.\n\nMolimo vas da ne otvarate tikete bez razloga, u suprotnom ćete biti sankcionisani.')
            .setTimestamp()
            .setFooter({ text: `${config.ORG_NAME} Podrška` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel('📩 Otvori Tiket')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Panel je uspešno postavljen. NAPOMENA: Ova komanda se koristi isključivo jednokratno prilikom postavljanja panela.', ephemeral: true });
    },
};
