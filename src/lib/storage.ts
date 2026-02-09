const DB_NAME = 'QR_APP_DB';
const STORE_NAME = 'images';

// --- INDEXED DB ---
async function getDB() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export const idb = {
    async set(key: string, value: any) {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        return new Promise((res) => (tx.oncomplete = res));
    },
    async get(key: string) {
        const db = await getDB();
        const req = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(key);
        return new Promise<any>((res) => (req.onsuccess = () => res(req.result)));
    },
    async remove(key: string) {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
        return new Promise((res) => (tx.oncomplete = res));
    }
};

// --- LOCAL STORAGE ---
export const local = {
    set(key: string, value: any) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    get(key: string) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    remove(key: string) {
        localStorage.removeItem(key);
    }
};