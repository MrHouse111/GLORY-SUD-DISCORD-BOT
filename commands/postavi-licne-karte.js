const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('postavi-licne-karte')
        .setDescription('Postavlja panel za kreiranje ličnih karata'),
    async execute(interaction) {
        if (!interaction.member) return interaction.reply({ content: '❌ Ove komande se mogu koristiti isključivo na serveru, a ne u privatnim porukama!', ephemeral: true });
        const hasRole = interaction.member.roles.cache.some(role => config.ALLOWED_ROLES.includes(role.name.toLowerCase()));
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: '❌ Samo uprava i administratori mogu koristiti ovu komandu!', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`👮 ${config.ORG_NAME} Lične Karte`)
            .setDescription(`Dobrodošli u ${config.ORG_NAME}!\n\nKliknite na dugme ispod kako biste kreirali svoju službenu Ličnu Kartu.\nNakon kreiranja, automatski ćete dobiti ulogu **${config.MEMBER_ROLE}**.`)
            .setThumbnail(interaction.guild.iconURL());

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_licna_karta')
                    .setLabel('Kreiraj Ličnu Kartu')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🪪')
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Panel za lične karte je uspešno postavljen.', ephemeral: true });
    },
};
