/**
 * Firebase Local Shim for Anacleto Panel
 * Mocking Firebase API using LocalStorage for Electron/Local testing
 */

const isElectron = /electron/i.test(navigator.userAgent) || window.location.protocol === 'file:';

if (isElectron) {
    console.log("🛠️ Running in Local Mode (Electron/File)");

    const localStore = {
        get: (key) => JSON.parse(localStorage.getItem(`anacleto_${key}`) || '[]'),
        set: (key, val) => localStorage.setItem(`anacleto_${key}`, JSON.stringify(val))
    };

    const mockFirestore = {
        collection: (name) => {
            return {
                path: name,
                doc: (id) => {
                    const items = localStore.get(name);
                    return {
                        id: id,
                        get: async () => {
                            const item = items.find(i => i.id === id);
                            return { exists: !!item, data: () => item };
                        },
                        update: async (data) => {
                            const idx = items.findIndex(i => i.id === id);
                            if (idx !== -1) {
                                items[idx] = { ...items[idx], ...data };
                                localStore.set(name, items);
                            }
                        },
                        set: async (data) => {
                            const idx = items.findIndex(i => i.id === id);
                            if (idx !== -1) items[idx] = { ...data, id };
                            else items.push({ ...data, id });
                            localStore.set(name, items);
                        },
                        delete: async () => {
                            const newItems = items.filter(i => i.id !== id);
                            localStore.set(name, newItems);
                        }
                    };
                },
                add: async (data) => {
                    const items = localStore.get(name);
                    const newDoc = { ...data, id: Math.random().toString(36).substr(2, 9) };
                    items.push(newDoc);
                    localStore.set(name, items);
                    return { id: newDoc.id };
                },
                get: async () => {
                    const items = localStore.get(name);
                    // Mock query support if needed
                    return {
                        forEach: (cb) => items.forEach(item => cb({ id: item.id, data: () => item })),
                        docs: items.map(item => ({ id: item.id, data: () => item }))
                    };
                },
                orderBy: function() { return this; },
                where: function() { return this; },
                limit: function() { return this; }
            };
        },
        settings: () => {}
    };

    const mockAuth = {
        onAuthStateChanged: (cb) => {
            // Auto-login as test user immediately to avoid redirect loops
            cb({ email: 'test@anacleto.local', uid: 'local-user' });
        },
        signInWithEmailAndPassword: async () => ({ user: { email: 'test@anacleto.local' } }),
        signOut: async () => { window.location.reload(); }
    };

    // Override the global firebase object
    window.firebase = {
        initializeApp: () => ({}),
        auth: () => mockAuth,
        firestore: () => mockFirestore,
    };
    // Assign to legacy property if needed
    window.firebase.firestore.Timestamp = {
        now: () => new Date(),
        fromDate: (d) => d
    };

    // For modular SDK imports (if used via import maps)
    window.mockFirestoreModular = {
        getFirestore: () => mockFirestore,
        collection: (db, name) => mockFirestore.collection(name),
        addDoc: (col, data) => col.add(data),
        getDocs: (col) => col.get(),
        deleteDoc: (docRef) => docRef.delete(),
        doc: (db, colName, id) => mockFirestore.collection(colName).doc(id),
        updateDoc: (docRef, data) => docRef.update(data),
        query: (col) => col,
        orderBy: () => ({}),
        Timestamp: window.firebase.firestore.Timestamp
    };
}
