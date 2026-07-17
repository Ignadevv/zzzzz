/**
 * Abstraction layer to switch between Firebase and Local Storage (for Electron)
 */

const isElectron = /electron/i.test(navigator.userAgent) || window.location.protocol === 'file:';

let firebaseFirestore = null;

// Only load Firebase if not in Electron or if we want to force it
if (!isElectron) {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    const firebaseConfig = {
        apiKey: "AIzaSyCLQKlAQNAnW2v5n5EdzDxW465a_Bgx8tU",
        authDomain: "anacleto-dcba8.firebaseapp.com",
        projectId: "anacleto-dcba8",
        storageBucket: "anacleto-dcba8.firebasestorage.app",
        messagingSenderId: "479401040293",
        appId: "1:479401040293:web:cc8bfaa40a23464a30704c"
    };

    const app = initializeApp(firebaseConfig);
    firebaseFirestore = getFirestore(app);
}

// --- LOCAL STORAGE MOCK FOR FIRESTORE ---
const localDb = {
    getCollection: (name) => {
        const data = localStorage.getItem(`db_${name}`);
        return data ? JSON.parse(data) : [];
    },
    saveCollection: (name, data) => {
        localStorage.setItem(`db_${name}`, JSON.stringify(data));
    }
};

export const db = firebaseFirestore;

export async function getDocs(colRef) {
    if (!isElectron) {
        const { getDocs: fGetDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        return await fGetDocs(colRef);
    } else {
        const name = colRef.path;
        const items = localDb.getCollection(name);
        return {
            forEach: (cb) => items.forEach(item => cb({ id: item.id, data: () => item }))
        };
    }
}

export async function addDoc(colRef, data) {
    if (!isElectron) {
        const { addDoc: fAddDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        return await fAddDoc(colRef, data);
    } else {
        const name = colRef.path;
        const items = localDb.getCollection(name);
        const newDoc = { ...data, id: Date.now().toString() };
        items.push(newDoc);
        localDb.saveCollection(name, items);
        return { id: newDoc.id };
    }
}

export async function updateDoc(docRef, data) {
    if (!isElectron) {
        const { updateDoc: fUpdateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        return await fUpdateDoc(docRef, data);
    } else {
        const colName = docRef.colName;
        const id = docRef.id;
        const items = localDb.getCollection(colName);
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...data };
            localDb.saveCollection(colName, items);
        }
    }
}

export async function deleteDoc(docRef) {
    if (!isElectron) {
        const { deleteDoc: fDeleteDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        return await fDeleteDoc(docRef);
    } else {
        const colName = docRef.colName;
        const id = docRef.id;
        const items = localDb.getCollection(colName);
        const newItems = items.filter(i => i.id !== id);
        localDb.saveCollection(colName, newItems);
    }
}

export function collection(db, name) {
    if (!isElectron) {
        return { path: name, db }; // Simplification for wrapper
    } else {
        return { path: name };
    }
}

export function doc(db, colName, id) {
    if (!isElectron) {
        return { colName, id, db };
    } else {
        return { colName, id };
    }
}

export function query(colRef, ...args) {
    return colRef; // Local doesn't support query yet, just returns the ref
}

export function orderBy(field, direction) {
    return { field, direction };
}

export const Timestamp = {
    now: () => new Date(),
    fromDate: (date) => date
};

export { isElectron };
