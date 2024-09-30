const DB_NAME = 'CollectiblesDB';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("IndexedDB error");

    request.onsuccess = (event) => resolve(event.target.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('collectibles', { keyPath: "id" });
    };
  });
};

export const getCachedData = async (storeKey) => {
  try {
    const db = await openDB();
    const transaction = db.transaction('collectibles', "readonly");
    const store = transaction.objectStore('collectibles');
    return await new Promise((resolve, reject) => {
      const request = store.get(storeKey);
      request.onerror = () => reject("Error fetching cached data");
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error("Error in getCachedData:", error);
    return null;
  }
};

export const cacheData = async (storeKey, data) => {
  try {
    const db = await openDB();
    const transaction = db.transaction('collectibles', "readwrite");
    const store = transaction.objectStore('collectibles');
    await new Promise((resolve, reject) => {
      const request = store.put({ 
        id: storeKey, 
        data: data, 
        timestamp: Date.now() 
      });
      request.onerror = () => reject("Error caching data");
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Error in cacheData:", error);
  }
};