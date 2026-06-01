const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('postavi-licne-karte')
        .setDescription('Postavlja panel za kreiranje ličnih karata'),
    async execute(interaction) {
        if (!interaction.member) return interaction.reply({ content: '❌ Ove komande se mogu koristiti isključivo na serveru, a ne u privatnim porukama!', ephemeral: true });
        const hasRole = interaction.member.roles.cache.some(role => ['director', 'zamenik nacelnika', 'predsednik suda', 'zamenik predsednika', 'sudija'].includes(role.name.toLowerCase()));
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: '❌ Samo Uprava Suda i Administratori mogu koristiti ovu komandu!', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('👮 SUD Lične Karte')
            .setDescription('Dobrodošli u SUD!\n\nKliknite na dugme ispod kako biste kreirali svoju službenu Ličnu Kartu.\nNakon kreiranja, automatski ćete dobiti ulogu **�lan suda**.')
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



