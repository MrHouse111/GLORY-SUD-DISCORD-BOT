const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('postavi-pravila')
        .setDescription('Postavlja panel sa pravilnikom u trenutni kanal.'),
    async execute(interaction) {
        if (!interaction.member) return interaction.reply({ content: '❌ Ove komande se mogu koristiti isključivo na serveru, a ne u privatnim porukama!', ephemeral: true });
        const hasRole = interaction.member.roles.cache.some(role => config.ALLOWED_ROLES.includes(role.name.toLowerCase()));
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: '❌ Samo uprava i administratori mogu koristiti ovu komandu!', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setColor('#1a5276') 
            .setTitle(`${config.ORG_NAME} - Zvanični Pravilnik i Propisi`)
            .setDescription(`Svi članovi ${config.ORG_NAME} organizacije su u obavezi da se strogo pridržavaju sledećih pravila. Nepoštovanje istih rezultiraće disciplinskim merama, suspenzijama ili trajnim udaljavanjem iz službe.`)
            .addFields(
                { 
                    name: '1. Aktivnost i Dužnost', 
                    value: '• **Neaktivnost:** Odsustvo duže od 48 sati bez prethodne zvanične najave rezultira otkazom.\n• **Evidencija:** Obavezna je prijava/odjava sa dužnosti pre i nakon smene. Rad na crno znači otkaz.\n• **Sastanci:** Prisustvo na zakazanim sastancima je obavezno. Neopravdan izostanak rezultira otkazom.' 
                },
                { 
                    name: '2. Lanac Komande i Ponašanje', 
                    value: '• **Hijerarhija:** Strogo poštovanje viših činova (Uprava). Nepoštovanje donosi disciplinski minus.\n• **Kolegijalnost:** Vređanje ili neprofesionalno ponašanje prema kolegama kažnjava se momentalnim otkazom.\n• **Intervencije:** Zahteva se maksimalan profesionalizam i fokus tokom radnih aktivnosti.' 
                },
                { 
                    name: '3. Radio Veza i Komunikacija', 
                    value: '• **Identifikacija:** Na radiju je strogo zabranjeno oslovljavanje po imenu, isključivo po broju značke.\n• **Prisutnost:** Tokom boravka u gradu (In-Game), član mora biti na radiju ili u zvaničnom voice kanalu. Ignorisanje ovog pravila znači otkaz.\n• **Oslovljavanje:** Obavezno je korišćenje zvaničnih prefiksa. Nepoštovanje donosi disciplinske mere.' 
                },
                { 
                    name: '4. Operacije i Rešavanje Konflikata', 
                    value: '• **Konflikti:** Svaki nesporazum sa drugom upravom ili organizacijom rešava se isključivo otvaranjem Tiketa na Discordu ili pozivanjem administracije.' 
                }
            )
            .setTimestamp()
            .setFooter({ text: `${config.ORG_NAME} Uprava | Odeljenje za Unutrašnju Kontrolu` });

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: 'Panel je uspešno postavljen. NAPOMENA: Ova komanda se koristi isključivo jednokratno prilikom postavljanja panela.', ephemeral: true });
    },
};
