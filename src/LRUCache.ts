export interface ILRUCache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
}

export class LRUCache<K, V> implements ILRUCache<K, V> {
  capacity: number;
  cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    // Key does not exist, return -1
    if (value === undefined) {
      return undefined;
    }

    // Raise to last used
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key: K, value: V): void {
    // If the key already exists, delete it so that it will be added
    // to the top of the cache
    if (this.cache.get(key)) {
      this.cache.delete(key);
    }

    // Insert the key,value pair into cache
    this.cache.set(key, value);

    // If we've exceeded the cache capacity,
    // then delete the least recently accessed value,
    // which will be the item at the bottom of the cache
    // i.e the first position
    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}
