type CacheEntry<T> = {
    data: T;
    timestamp: number;
};

const memory = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 1000 * 60 * 10; //10 minutes

export function getCache<T>(key: string): T | null {
    const now = Date.now();
    const hit = memory.get(key);
    if (hit && now - hit.timestamp < CACHE_TTL) {
        return hit.data as T;
    }
    try {
        const raw = localStorage.getItem(key);
        if (raw == null) {
            return null;
        }
        const parsed = JSON.parse(raw) as CacheEntry<T>;
        if (now - parsed.timestamp < CACHE_TTL) {
            memory.set(key, parsed);
            return parsed.data;
        }
    } catch {}
    return null;
}

export function setCache<T>(key: string, data: T){
    const wrapped: CacheEntry<T> = { timestamp: Date.now(), data };
    memory.set(key, wrapped);
    try {
        localStorage.setItem(key, JSON.stringify(wrapped));
    } catch {}
}
