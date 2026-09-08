const STORAGE_PREFIX = 'hongren-game:';

export const storage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(STORAGE_PREFIX + key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, value);
    } catch (e) {
      console.error('storage.setItem failed:', e);
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      // ignore
    }
  },

  clear(): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keys.push(k);
        }
      }
      keys.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  },
};
