const { db, admin } = require('./firebase');

function getTodayString() {
    const now = new Date();
    // Koristi Europe/Belgrade timezone da datum bude tačan za Srbiju
    return now.toLocaleDateString('en-CA', { timeZone: 'Europe/Belgrade' }); // Vraća YYYY-MM-DD format
}

module.exports = {
    addMessage: async (userId, username) => {
        if (!db) {
            console.warn('[STATS] Firebase db je null - poruke se NE beleže!');
            return;
        }
        try {
            const ref = db.collection('sud_stats').doc(userId);
            const today = getTodayString();
            
            await ref.set({
                username: username,
                messages: {
                    [today]: admin.firestore.FieldValue.increment(1)
                }
            }, { merge: true });
        } catch (error) {
            console.error('[STATS ERROR] Greška pri beleženju poruke:', error.message);
        }
    },

    addVoiceTime: async (userId, username, durationMs) => {
        if (!db) {
            console.warn('[STATS] Firebase db je null - voice vreme se NE beleži!');
            return;
        }
        try {
            const ref = db.collection('sud_stats').doc(userId);
            const today = getTodayString();
            
            await ref.set({
                username: username,
                voice: {
                    [today]: admin.firestore.FieldValue.increment(durationMs)
                }
            }, { merge: true });
        } catch (error) {
            console.error('[STATS ERROR] Greška pri beleženju voice vremena:', error.message);
        }
    },

    addDutyTime: async (userId, username, durationMs) => {
        if (!db) {
            console.warn('[STATS] Firebase db je null - duty vreme se NE beleži!');
            return;
        }
        try {
            const ref = db.collection('sud_stats').doc(userId);
            const today = getTodayString();
            
            await ref.set({
                username: username,
                duty: {
                    [today]: admin.firestore.FieldValue.increment(durationMs)
                }
            }, { merge: true });
        } catch (error) {
            console.error('[STATS ERROR] Greška pri beleženju duty vremena:', error.message);
        }
    },

    addPlus: async (userId, username) => {
        if (!db) return;
        const ref = db.collection('sud_stats').doc(userId);
        await ref.set({
            username: username,
            pluses: admin.firestore.FieldValue.increment(1)
        }, { merge: true });
    },

    addMinus: async (userId, username) => {
        if (!db) return;
        const ref = db.collection('sud_stats').doc(userId);
        await ref.set({
            username: username,
            minuses: admin.firestore.FieldValue.increment(1)
        }, { merge: true });
    },

    addOtkaz: async (userId, username) => {
        if (!db) return;
        const ref = db.collection('sud_stats').doc(userId);
        await ref.set({
            username: username,
            otkazi: admin.firestore.FieldValue.increment(1)
        }, { merge: true });
    },

    getUserStats: async (userId) => {
        if (!db) return null;
        const doc = await db.collection('sud_stats').doc(userId).get();
        return doc.exists ? doc.data() : null;
    },

    getAllStats: async () => {
        if (!db) return {};
        const snapshot = await db.collection('sud_stats').get();
        const users = {};
        snapshot.forEach(doc => {
            users[doc.id] = doc.data();
        });
        return users;
    },
    
    cleanOldData: async () => {
        if (!db) return;
        const snapshot = await db.collection('sud_stats').get();
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        const batch = db.batch();
        let operationsCount = 0;

        snapshot.forEach((doc) => {
            const data = doc.data();
            let updates = {};
            let needsUpdate = false;

            if (data.messages && typeof data.messages === 'object') {
                for (const date in data.messages) {
                    if (new Date(date) < sevenDaysAgo) {
                        updates[`messages.${date}`] = admin.firestore.FieldValue.delete();
                        needsUpdate = true;
                    }
                }
            }
            if (data.voice && typeof data.voice === 'object') {
                for (const date in data.voice) {
                    if (new Date(date) < sevenDaysAgo) {
                        updates[`voice.${date}`] = admin.firestore.FieldValue.delete();
                        needsUpdate = true;
                    }
                }
            }
            if (data.duty && typeof data.duty === 'object') {
                for (const date in data.duty) {
                    if (new Date(date) < sevenDaysAgo) {
                        updates[`duty.${date}`] = admin.firestore.FieldValue.delete();
                        needsUpdate = true;
                    }
                }
            }

            // Literal fields with dots
            for (const key in data) {
                if (key.startsWith('messages.') || key.startsWith('voice.') || key.startsWith('duty.')) {
                    const dateStr = key.split('.')[1];
                    if (new Date(dateStr) < sevenDaysAgo) {
                        // Batch update allows deleting nested fields easily with dots, but for literal fields with dots it might be tricky.
                        // We will just leave literal fields to avoid crashes, they will age out.
                    }
                }
            }

            if (needsUpdate) {
                batch.update(db.collection('sud_stats').doc(doc.id), updates);
                operationsCount++;
            }
        });

        if (operationsCount > 0) {
            await batch.commit();
        }
    }
};


