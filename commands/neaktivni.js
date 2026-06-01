const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const statsStore = require('../utils/statsStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('neaktivni')
        .setDescription('Prikazuje listu potpuno neaktivnih članova za poslednjih 7 dana (Samo za Upravu Suda)'),
    async execute(interaction) {
        const hasRole = interaction.member.roles.cache.some(role => ['director', 'zamenik nacelnika', 'predsednik suda', 'zamenik predsednika', 'sudija'].includes(role.name.toLowerCase()));
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        
        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: '❌ Nemate dozvolu! Ovu komandu mogu koristiti samo Uprava Suda.', ephemeral: true });
        }

        await interaction.deferReply();

        const allStats = await statsStore.getAllStats();
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        let members;
        try {
            members = await interaction.guild.members.fetch();
        } catch (error) {
            console.error('Greška pri dohvatanju članova:', error);
            return interaction.editReply('❌ Došlo je do greške pri dohvatanju članova servera.');
        }

        const inactive = [];

        members.forEach(member => {
            if (member.user.bot) return;

            let messageCount = 0;
            let voiceMs = 0;
            let dutyMs = 0;
            const userStats = allStats[member.user.id];

            if (userStats) {
                if (userStats.messages && typeof userStats.messages === 'object') {
                    for (const [dateStr, count] of Object.entries(userStats.messages)) {
                        if (new Date(dateStr) >= sevenDaysAgo) {
                            messageCount += count;
                        }
                    }
                }
                
                if (userStats.voice && typeof userStats.voice === 'object') {
                    for (const [dateStr, durationMs] of Object.entries(userStats.voice)) {
                        if (new Date(dateStr) >= sevenDaysAgo) {
                            voiceMs += durationMs;
                        }
                    }
                }

                if (userStats.duty && typeof userStats.duty === 'object') {
                    for (const [dateStr, durationMs] of Object.entries(userStats.duty)) {
                        if (new Date(dateStr) >= sevenDaysAgo) {
                            dutyMs += durationMs;
                        }
                    }
                }

                for (const [key, value] of Object.entries(userStats)) {
                    if (key.startsWith('messages.')) {
                        const dateStr = key.substring(9);
                        if (new Date(dateStr) >= sevenDaysAgo) {
                            messageCount += value;
                        }
                    } else if (key.startsWith('voice.')) {
                        const dateStr = key.substring(6);
                        if (new Date(dateStr) >= sevenDaysAgo) {
                            voiceMs += value;
                        }
                    } else if (key.startsWith('duty.')) {
                        const dateStr = key.substring(5);
                        if (new Date(dateStr) >= sevenDaysAgo) {
                            dutyMs += value;
                        }
                    }
                }
            }

            if (messageCount === 0 && voiceMs === 0 && dutyMs === 0) {
                inactive.push(member);
            }
        });

        const embeds = [];
        const pageSize = 20;
        const totalPages = Math.ceil(inactive.length / pageSize) || 1;

        for (let page = 0; page < totalPages; page++) {
            const start = page * pageSize;
            const end = Math.min(start + pageSize, inactive.length);
            const pageMembers = inactive.slice(start, end);

            const memberList = pageMembers.map((m, i) => `${start + i + 1}. <@${m.user.id}>`).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle(page === 0 ? `👻 Potpuno neaktivni članovi (${inactive.length} ukupno)` : `👻 Neaktivni (nastavak)`)
                .setDescription(memberList || 'Nema neaktivnih članova! 🎉')
                .setFooter({ text: `Stranica ${page + 1}/${totalPages} • Poslednjih 7 dana` });

            if (page === 0) {
                embed.addFields({
                    name: 'ℹ️ Napomena',
                    value: 'Ovi članovi imaju **0 minuta dužnosti**, **0 poruka** i **0 minuta** u voice kanalima u poslednjih 7 dana.',
                    inline: false
                });
            }

            embeds.push(embed);
        }

        const maxEmbeds = Math.min(embeds.length, 10);
        await interaction.editReply({ embeds: embeds.slice(0, maxEmbeds) });
    },
};



