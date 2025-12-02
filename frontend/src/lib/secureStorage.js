/**
 * Secure Storage Utility
 * Provides secure storage for sensitive data using IndexedDB
 * Never use localStorage for private keys or sensitive data!
 */

class SecureStorage {
  constructor() {
    this.dbName = 'pqc_secure_storage';
    this.version = 1;
    this.stores = {
      keys: 'encryption_keys',
      sessions: 'sessions',
      cache: 'cache'
    };
  }

  /**
   * Open IndexedDB database
   */
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(this.stores.keys)) {
          db.createObjectStore(this.stores.keys);
        }
        if (!db.objectStoreNames.contains(this.stores.sessions)) {
          db.createObjectStore(this.stores.sessions);
        }
        if (!db.objectStoreNames.contains(this.stores.cache)) {
          const cacheStore = db.createObjectStore(this.stores.cache);
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Store private key securely
   */
  async storePrivateKey(userId, privateKey) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.stores.keys], 'readwrite');
        const store = transaction.objectStore(this.stores.keys);
        const request = store.put(privateKey, `private_key_${userId}`);

        request.onsuccess = () => {
          console.log('✅ Private key stored securely');
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to store private key:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error storing private key:', error);
      throw error;
    }
  }

  /**
   * Retrieve private key
   */
  async getPrivateKey(userId) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.stores.keys], 'readonly');
        const store = transaction.objectStore(this.stores.keys);
        const request = store.get(`private_key_${userId}`);

        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result);
          } else {
            reject(new Error('Private key not found'));
          }
        };

        request.onerror = () => {
          console.error('Failed to retrieve private key:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error retrieving private key:', error);
      throw error;
    }
  }

  /**
   * Delete private key
   */
  async deletePrivateKey(userId) {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.stores.keys], 'readwrite');
        const store = transaction.objectStore(this.stores.keys);
        const request = store.delete(`private_key_${userId}`);

        request.onsuccess = () => {
          console.log('✅ Private key deleted');
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to delete private key:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error deleting private key:', error);
      throw error;
    }
  }

  /**
   * Store session data
   */
  async storeSession(key, value, expiryMinutes = 30) {
    try {
      const db = await this.openDB();
      const expiry = Date.now() + (expiryMinutes * 60 * 1000);
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.stores.sessions], 'readwrite');
        const store = transaction.objectStore(this.stores.sessions);
        const request = store.put({ value, expiry }, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error storing session:', error);
      throw error;
    }
  }

  /**
   * Get session data
   */
  async getSession(key) {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.stores.sessions], 'readonly');
        const store = transaction.objectStore(this.stores.sessions);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          // Check if expired
          if (result.expiry < Date.now()) {
            this.deleteSession(key); // Clean up expired session
            resolve(null);
            return;
          }

          resolve(result.value);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Delete session data
   */
  async deleteSession(key) {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.stores.sessions], 'readwrite');
        const store = transaction.objectStore(this.stores.sessions);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  /**
   * Cache data with timestamp
   */
  async cacheData(key, data, ttlMinutes = 60) {
    try {
      const db = await this.openDB();
      const timestamp = Date.now();
      const expiry = timestamp + (ttlMinutes * 60 * 1000);
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.stores.cache], 'readwrite');
        const store = transaction.objectStore(this.stores.cache);
        const request = store.put({ data, timestamp, expiry }, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Get cached data
   */
  async getCachedData(key) {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.stores.cache], 'readonly');
        const store = transaction.objectStore(this.stores.cache);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          // Check if expired
          if (result.expiry < Date.now()) {
            this.deleteCachedData(key);
            resolve(null);
            return;
          }

          resolve(result.data);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Delete cached data
   */
  async deleteCachedData(key) {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.stores.cache], 'readwrite');
        const store = transaction.objectStore(this.stores.cache);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting cached data:', error);
    }
  }

  /**
   * Clear all expired data
   */
  async clearExpired() {
    try {
      const db = await this.openDB();
      const now = Date.now();
      
      // Clear expired sessions
      const sessionTransaction = db.transaction([this.stores.sessions], 'readwrite');
      const sessionStore = sessionTransaction.objectStore(this.stores.sessions);
      const sessionRequest = sessionStore.openCursor();

      sessionRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.expiry < now) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      // Clear expired cache
      const cacheTransaction = db.transaction([this.stores.cache], 'readwrite');
      const cacheStore = cacheTransaction.objectStore(this.stores.cache);
      const cacheRequest = cacheStore.openCursor();

      cacheRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.expiry < now) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      console.log('✅ Expired data cleared');
    } catch (error) {
      console.error('Error clearing expired data:', error);
    }
  }

  /**
   * Clear all stored data (use with caution!)
   */
  async clearAll() {
    try {
      const db = await this.openDB();
      
      const promises = Object.values(this.stores).map(storeName => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });

      await Promise.all(promises);
      console.log('✅ All secure storage cleared');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStats() {
    try {
      const db = await this.openDB();
      const stats = {};

      for (const [name, storeName] of Object.entries(this.stores)) {
        await new Promise((resolve) => {
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.count();

          request.onsuccess = () => {
            stats[name] = request.result;
            resolve();
          };

          request.onerror = () => {
            stats[name] = 0;
            resolve();
          };
        });
      }

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      return {};
    }
  }
}

// Export singleton instance
const secureStorage = new SecureStorage();

// Cleanup expired data on load
if (typeof window !== 'undefined') {
  secureStorage.clearExpired();
  
  // Schedule periodic cleanup (every hour)
  setInterval(() => {
    secureStorage.clearExpired();
  }, 60 * 60 * 1000);
}

export default secureStorage;































/**
 * Secure Storage Utility
 * Provides secure storage for sensitive data using IndexedDB
 * Never use localStorage for private keys or sensitive data!
 */

// export class SecureKeyStorage {
//   constructor() {
//     this.dbName = 'pqc_secure_storage';
//     this.version = 1;
//     this.stores = {
//       keys: 'encryption_keys',
//       sessions: 'sessions',
//       cache: 'cache'
//     };
//   }

//   /**
//    * Open IndexedDB database
//    */
//   async openDB() {
//     return new Promise((resolve, reject) => {
//       const request = indexedDB.open(this.dbName, this.version);

//       request.onerror = () => {
//         console.error('Failed to open IndexedDB:', request.error);
//         reject(request.error);
//       };

//       request.onsuccess = () => {
//         resolve(request.result);
//       };

//       request.onupgradeneeded = (event) => {
//         const db = event.target.result;

//         // Create object stores if they don't exist
//         if (!db.objectStoreNames.contains(this.stores.keys)) {
//           db.createObjectStore(this.stores.keys);
//         }
//         if (!db.objectStoreNames.contains(this.stores.sessions)) {
//           db.createObjectStore(this.stores.sessions);
//         }
//         if (!db.objectStoreNames.contains(this.stores.cache)) {
//           const cacheStore = db.createObjectStore(this.stores.cache);
//           cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
//         }
//       };
//     });
//   }

//   /**
//    * Store private key securely
//    */
//   async storePrivateKey(userId, privateKey) {
//     try {
//       const db = await this.openDB();
//       return new Promise((resolve, reject) => {
//         const transaction = db.transaction([this.stores.keys], 'readwrite');
//         const store = transaction.objectStore(this.stores.keys);
//         const request = store.put(privateKey, `private_key_${userId}`);

//         request.onsuccess = () => {
//           console.log('✅ Private key stored securely');
//           resolve();
//         };

//         request.onerror = () => {
//           console.error('Failed to store private key:', request.error);
//           reject(request.error);
//         };
//       });
//     } catch (error) {
//       console.error('Error storing private key:', error);
//       throw error;
//     }
//   }

//   /**
//    * Retrieve private key
//    */
//   async getPrivateKey(userId) {
//     try {
//       const db = await this.openDB();
//       return new Promise((resolve, reject) => {
//         const transaction = db.transaction([this.stores.keys], 'readonly');
//         const store = transaction.objectStore(this.stores.keys);
//         const request = store.get(`private_key_${userId}`);

//         request.onsuccess = () => {
//           if (request.result) {
//             resolve(request.result);
//           } else {
//             reject(new Error('Private key not found'));
//           }
//         };

//         request.onerror = () => {
//           console.error('Failed to retrieve private key:', request.error);
//           reject(request.error);
//         };
//       });
//     } catch (error) {
//       console.error('Error retrieving private key:', error);
//       throw error;
//     }
//   }

//   /**
//    * Delete private key
//    */
//   async deletePrivateKey(userId) {
//     try {
//       const db = await this.openDB();
//       return new Promise((resolve, reject) => {
//         const transaction = db.transaction([this.stores.keys], 'readwrite');
//         const store = transaction.objectStore(this.stores.keys);
//         const request = store.delete(`private_key_${userId}`);

//         request.onsuccess = () => {
//           console.log('✅ Private key deleted');
//           resolve();
//         };

//         request.onerror = () => {
//           console.error('Failed to delete private key:', request.error);
//           reject(request.error);
//         };
//       });
//     } catch (error) {
//       console.error('Error deleting private key:', error);
//       throw error;
//     }
//   }

//   /**
//    * Clear all stored data (use with caution!)
//    */
//   async clearAll() {
//     try {
//       const db = await this.openDB();
      
//       const promises = Object.values(this.stores).map(storeName => {
//         return new Promise((resolve, reject) => {
//           const transaction = db.transaction([storeName], 'readwrite');
//           const store = transaction.objectStore(storeName);
//           const request = store.clear();

//           request.onsuccess = () => resolve();
//           request.onerror = () => reject(request.error);
//         });
//       });

//       await Promise.all(promises);
//       console.log('✅ All secure storage cleared');
//     } catch (error) {
//       console.error('Error clearing all data:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get storage usage statistics
//    */
//   async getStats() {
//     try {
//       const db = await this.openDB();
//       const stats = {};

//       for (const [name, storeName] of Object.entries(this.stores)) {
//         await new Promise((resolve) => {
//           const transaction = db.transaction([storeName], 'readonly');
//           const store = transaction.objectStore(storeName);
//           const request = store.count();

//           request.onsuccess = () => {
//             stats[name] = request.result;
//             resolve();
//           };

//           request.onerror = () => {
//             stats[name] = 0;
//             resolve();
//           };
//         });
//       }

//       return stats;
//     } catch (error) {
//       console.error('Error getting stats:', error);
//       return {};
//     }
//   }
// }

// // Export default instance
// const secureStorage = new SecureKeyStorage();
// export default secureStorage;