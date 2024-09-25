const dbName = 'CollectiblesDB';
const dbVersion = 1;

let db;

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains('collectibles')) {
        db.createObjectStore('collectibles', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(event.target.error);
    };
  });
};

const saveData = async (key, data) => {
  const transaction = db.transaction(['collectibles'], 'readwrite');
  const store = transaction.objectStore('collectibles');
  const timestamp = Date.now();
  await store.put({ key, data, timestamp });
};

const getData = async (key) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['collectibles'], 'readonly');
    const store = transaction.objectStore('collectibles');
    const request = store.get(key);
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      console.error('Error getting data:', event.target.error);
      reject(event.target.error);
    };
  });
};

const isDataStale = (timestamp, expirationTime) => {
  return (Date.now() - timestamp) > expirationTime;
};

export { initDB, saveData, getData, isDataStale };
