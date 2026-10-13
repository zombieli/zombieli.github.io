import { validateRecord } from './core.mjs';
const DATABASE = 'inspection-notebook-v1';
let connection;
export async function openStorage() {
  if (!globalThis.indexedDB) throw new Error('Device storage is unavailable. Enable browser storage and retry.');
  if (connection) return connection;
  connection = await new Promise((resolve,reject) => {
    const request = indexedDB.open(DATABASE,1);
    request.onupgradeneeded = () => request.result.createObjectStore('records',{keyPath:'id'});
    request.onerror = () => reject(new Error('Device storage is unavailable. Check browser permissions and retry.'));
    request.onblocked = () => reject(new Error('Device storage is blocked by another tab. Close older notebook tabs and retry.'));
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => { database.close(); connection = undefined; };
      resolve(database);
    };
  });
  return connection;
}
function transaction(database, operation) {
  return new Promise((resolve,reject) => {
    const tx = database.transaction('records','readwrite');
    let failure;
    const fail = error => { if(failure)return; failure = error; tx.abort(); };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(failure || new Error('The storage transaction failed. Nothing was changed. Check storage space and retry.'));
    tx.onerror = () => {};
    try { operation(tx.objectStore('records'),fail); } catch(error) { fail(error); }
  });
}
export async function listRecords() {
  const database = await openStorage();
  return new Promise((resolve,reject) => {
    const tx = database.transaction('records','readonly');
    const request = tx.objectStore('records').getAll();
    let records;
    request.onsuccess = () => { records=request.result; };
    tx.oncomplete = () => {
      try { resolve(records.map(validateRecord).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id))); }
      catch { reject(new Error('Stored records do not match this notebook version. Existing data has been preserved.')); }
    };
    tx.onabort = () => reject(new Error('Unable to read device storage. Retry to reconnect.'));
  });
}
export async function importRecords(records) {
  const valid = records.map(validateRecord);
  const ids = new Set();
  for (const record of valid) {
    if (ids.has(record.id)) throw new Error(`Duplicate identity in backup: ${record.id}.`);
    ids.add(record.id);
  }
  const database = await openStorage();
  await transaction(database,(store,fail) => {
    const count = store.count();
    count.onsuccess = () => {
      if(count.result + valid.length > 1000) {fail(new Error('This notebook supports at most 1000 records. Nothing was imported.'));return;}
      for (const record of valid) {
        const request = store.add(record);
        request.onerror = event => {
          event.preventDefault();
          fail(new Error(request.error?.name === 'ConstraintError' ? `Record ${record.id} already exists. Nothing was imported.` : 'Import failed in device storage. Nothing was imported.'));
        };
      }
    };
  });
}
export async function saveRecord(record, expectedUpdatedAt) {
  const valid = validateRecord(record);
  const database = await openStorage();
  await transaction(database,(store,fail) => {
    const request = store.get(valid.id);
    request.onsuccess = () => {
      const previous = request.result;
      if (!previous) { fail(new Error('This record no longer exists. Reload the notebook.')); return; }
      if (previous.status !== 'draft') { fail(new Error('Submitted records are read-only.')); return; }
      if (previous.updatedAt !== expectedUpdatedAt) { fail(new Error('This draft changed in another tab. Reload before editing.')); return; }
      if (previous.createdAt !== valid.createdAt || valid.updatedAt < previous.updatedAt) { fail(new Error('Invalid record timestamp. Reload before editing.')); return; }
      store.put(valid);
    };
  });
}
