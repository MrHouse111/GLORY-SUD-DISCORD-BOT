const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const statsStore = require('../utils/statsStore');
const { db } = require('../utils/firebase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('izvestaj')
        .setDescription('Generiše nedeljni izveštaj aktivnosti cele LSPD ekipe (Samo za Načelnike)'),
    async execute(interaction) {
        const hasRole = interaction.member.roles.cache.some(role => ['director', 'zamenik nacelnika'].includes(role.name.toLowerCase()));
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        
        if (!hasRole && !isAdmin) {
            return interaction.reply({ content: '❌ Nemate dozvolu! Ovu komandu mogu koristiti samo načelnici.', ephemeral: true });
        }

        await interaction.deferReply(); 

        // Dijagnostika - proveri Firebase konekciju
        const firebaseConnected = db !== null;
        console.log(`[IZVESTAJ] Firebase konekcija: ${firebaseConnected ? 'POVEZAN ✅' : 'NIJE POVEZAN ❌'}`);

        await statsStore.cleanOldData();

        const allStats = await statsStore.getAllStats();
        const statsKeys = Object.keys(allStats);
        console.log(`[IZVESTAJ] Broj korisnika u stats kolekciji: ${statsKeys.length}`);
        if (statsKeys.length > 0) {
            // Loguj primer prvog korisnika za dijagnostiku
            const firstKey = statsKeys[0];
            console.log(`[IZVESTAJ] Primer podataka (${firstKey}):`, JSON.stringify(allStats[firstKey]).substring(0, 200));
        }

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        let members;
        try {
            members = await interaction.guild.members.fetch();
        } catch (error) {
            console.error('Greška pri dohvatanju članova:', error);
            return interaction.editReply('❌ Došlo je do greške pri dohvatanju članova servera.');
        }

        const userActivity = [];

        members.forEach(member => {
            if (member.user.bot) return; 

            let messageCount = 0;
            let voiceMs = 0;
            let dutyMs = 0;
            const userStats = allStats[member.user.id];

            if (userStats) {
                // Novi način: objekti
                if (userStats.messages && typeof userStats.messages === 'object') {
                    for (const [dateStr, count] of Object.entries(userStats.messages)) {
                        const msgDate = new Date(dateStr);
                        if (msgDate >= sevenDaysAgo) {
                            messageCount += count;
                        }
                    }
                }
                
                if (userStats.voice && typeof userStats.voice === 'object') {
                    for (const [dateStr, durationMs] of Object.entries(userStats.voice)) {
                        const msgDate = new Date(dateStr);
                        if (msgDate >= sevenDaysAgo) {
                            voiceMs += durationMs;
                        }
                    }
                }

                if (userStats.duty && typeof userStats.duty === 'object') {
                    for (const [dateStr, durationMs] of Object.entries(userStats.duty)) {
                        const msgDate = new Date(dateStr);
                        if (msgDate >= sevenDaysAgo) {
                            dutyMs += durationMs;
                        }
                    }
                }

                // Stari način: literalni ključevi
                for (const [key, value] of Object.entries(userStats)) {
                    if (key.startsWith('messages.')) {
                        const dateStr = key.substring(9);
                        const msgDate = new Date(dateStr);
                        if (msgDate >= sevenDaysAgo) {
                            messageCount += value;
                        }
                    } else if (key.startsWith('voice.')) {
                        const dateStr = key.substring(6);
                        const msgDate = new Date(dateStr);
                        if (msgDate >= sevenDaysAgo) {
                            voiceMs += value;
                        }
                    } else if (key.startsWith('duty.')) {
                        const dateStr = key.substring(5);
                        const msgDate = new Date(dateStr);
                        if (msgDate >= sevenDaysAgo) {
                            dutyMs += value;
                        }
                    }
                }
            }
            
            // Formatiranje voice
            const voiceMinutes = Math.floor(voiceMs / 60000);
            const voiceHours = Math.floor(voiceMinutes / 60);
            const voiceMinsRemainder = voiceMinutes % 60;
            const voiceString = `${voiceHours}h ${voiceMinsRemainder}m`;

            // Formatiranje dužnosti
            const dutyMinutes = Math.floor(dutyMs / 60000);
            const dutyHours = Math.floor(dutyMinutes / 60);
            const dutyMinsRemainder = dutyMinutes % 60;
            const dutyString = `${dutyHours}h ${dutyMinsRemainder}m`;

            userActivity.push({
                id: member.user.id,
                username: member.user.username,
                displayName: member.displayName,
                messageCount: messageCount,
                voiceMs: voiceMs,
                voiceString: voiceString,
                dutyMs: dutyMs,
                dutyString: dutyString,
                pluses: userStats ? (userStats.pluses || 0) : 0,
                minuses: userStats ? (userStats.minuses || 0) : 0
            });
        });

        // NOVO SORTIRANJE
        // 1. Vreme na dužnosti (dutyMs)
        // 2. Plusevi minus Minusi (ako je vreme na dužnosti isto)
        // 3. Poruke (ako su i poeni isti)
        userActivity.sort((a, b) => {
            if (b.dutyMs !== a.dutyMs) {
                return b.dutyMs - a.dutyMs;
            }
            const aPoints = a.pluses - a.minuses;
            const bPoints = b.pluses - b.minuses;
            if (bPoints !== aPoints) {
                return bPoints - aPoints;
            }
            return b.messageCount - a.messageCount;
        });

        const topActive = userActivity.slice(0, 10);
        
        // Najmanje aktivni su oni koji imaju neku aktivnost (makar poruku ili dužnost), ali su na dnu liste
        const activeUsers = userActivity.filter(u => u.dutyMs > 0 || u.messageCount > 0 || u.voiceMs > 0);
        const leastActive = activeUsers.reverse().slice(0, 10);
        
        const inactive = userActivity.filter(u => u.dutyMs === 0 && u.messageCount === 0 && u.voiceMs === 0);

        const formatMember = (u, i) => {
            const points = u.pluses - u.minuses;
            const pointsStr = points > 0 ? `+${points}` : points;
            return `**${i + 1}.** <@${u.id}>\n⏱️ **Dužnost:** \`${u.dutyString}\` | ⚖️ **Ocena:** \`${pointsStr}\` (➕${u.pluses} ➖${u.minuses})\n💬 **Poruke:** \`${u.messageCount}\` | 🎙️ **Voice:** \`${u.voiceString}\``;
        };

        let topText = topActive.map(formatMember).join('\n\n') || 'Nema podataka';
        let leastText = leastActive.map(formatMember).join('\n\n') || 'Nema podataka';

        // Dijagnostička informacija
        const diagText = `🔧 Firebase: ${firebaseConnected ? '✅ Povezan' : '❌ Nije povezan'} | Zapisi u bazi: **${statsKeys.length}** | Članova na serveru: **${userActivity.length}**`;

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('📊 LSPD Nedeljni Izveštaj Aktivnosti (Poslednjih 7 dana)')
            .addFields(
                { name: '🏆 Najaktivniji', value: topText, inline: false },
                { name: '⚠️ Najmanje aktivni', value: leastText, inline: false },
                { name: `👻 Potpuno neaktivni (${inactive.length} članova)`, value: 'Za kompletnu listu neaktivnih koristite komandu `/neaktivni`', inline: false },
                { name: '🔧 Dijagnostika', value: diagText, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Izveštaj generisan za Načelnika' });

        await interaction.editReply({ embeds: [embed] });
    },
};
