(function (root) {
  "use strict";

  // Keep the timestamp map compatible with older pages and Android Preferences.
  const key = "mado-stamps";
  let memory = {};
  let memoryOnly = false;
  let lockDatabase;

  function read() {
    if (memoryOnly) return { ...memory };
    try {
      const value = JSON.parse(root.localStorage.getItem(key) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return { ...memory };
    }
  }

  function openLockDatabase() {
    if (!lockDatabase) {
      lockDatabase = new Promise((resolve) => {
        try {
          const request = root.indexedDB.open("mado-stamp-writes", 1);
          request.onupgradeneeded = () => request.result.createObjectStore("writes");
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
        } catch { resolve(null); }
      });
    }
    return lockDatabase;
  }

  function withWriteLock(write) {
    if (root.navigator?.locks?.request) return root.navigator.locks.request(key, write);
    if (!root.indexedDB) return write();
    // Read/write transactions on one object store run in order across tabs.
    return openLockDatabase().then((db) => {
      if (!db) return write();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("writes", "readwrite");
        const request = tx.objectStore("writes").get(key);
        request.onsuccess = () => {
          try { write(); } catch (error) { reject(error); }
        };
        tx.oncomplete = resolve;
        tx.onabort = () => reject(tx.error);
      });
    });
  }

  function update(edit, saved) {
    return withWriteLock(() => {
      const previous = read();
      const next = edit(previous);
      memory = next;
      try { root.localStorage.setItem(key, JSON.stringify(next)); }
      catch { memoryOnly = true; }
      saved(next, previous);
    });
  }

  function toggle(ids, saved) {
    return update((previous) => {
      const next = { ...previous };
      if (ids.some((entry) => previous[entry])) {
        for (const entry of ids) delete next[entry];
      } else {
        next[ids[0]] = Date.now();
      }
      return next;
    }, saved);
  }

  function clear(saved) {
    return update(() => ({}), saved);
  }

  function onChange(listener) {
    root.addEventListener("storage", (event) => {
      if (event.storageArea === root.localStorage && (event.key === key || event.key === null)) listener(read());
    });
  }

  root.MadoStamps = { read, toggle, clear, onChange };
})(window);
