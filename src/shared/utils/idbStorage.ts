import type { StateStorage } from 'zustand/middleware';

const DB_NAME = 'pulse-chat';
const STORE = 'kv';
const WRITE_DELAY = 300;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

const indexedDbStorage: StateStorage = {
  getItem: async (key) => (await run<string | undefined>('readonly', (s) => s.get(key))) ?? null,
  // Debounced: status updates fire often and the payload can hold 10k messages.
  setItem: (key, value) => {
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(() => void run('readwrite', (s) => s.put(value, key)), WRITE_DELAY));
  },
  removeItem: async (key) => {
    await run('readwrite', (s) => s.delete(key));
  },
};

export const chatStorage: StateStorage =
  typeof indexedDB === 'undefined' ? localStorage : indexedDbStorage;
