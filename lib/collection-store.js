// lib/collection-store.js
// Pluggable storage abstraction for persisting Hunter domain search results.
// Uses filesystem storage in data/collections/ or falls back to in-memory if filesystem unavailable.

const fs = require('fs');
const path = require('path');

const COLLECTIONS_DIR = path.join(process.cwd(), 'data', 'collections');

// In-memory fallback store
const memoryStore = new Map();

// Ensure collections directory exists
function ensureCollectionsDir() {
  try {
    if (!fs.existsSync(COLLECTIONS_DIR)) {
      fs.mkdirSync(COLLECTIONS_DIR, { recursive: true });
    }
    return true;
  } catch (err) {
    console.warn('Failed to create collections directory, using in-memory fallback:', err.message);
    return false;
  }
}

// Check if filesystem is available
function isFilesystemAvailable() {
  try {
    ensureCollectionsDir();
    const testFile = path.join(COLLECTIONS_DIR, '.test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return true;
  } catch (err) {
    return false;
  }
}

const useFilesystem = isFilesystemAvailable();

/**
 * Store collection results for a domain
 * @param {string} domain - The domain name
 * @param {object} data - The collection data (items, total, metadata)
 * @returns {Promise<boolean>} - Success status
 */
async function storeCollection(domain, data) {
  try {
    const sanitizedDomain = domain.replace(/[^a-z0-9.-]/gi, '_');
    
    if (useFilesystem) {
      const filePath = path.join(COLLECTIONS_DIR, `${sanitizedDomain}.json`);
      const storeData = {
        domain,
        ...data,
        storedAt: new Date().toISOString(),
      };
      fs.writeFileSync(filePath, JSON.stringify(storeData, null, 2));
      return true;
    } else {
      // In-memory fallback
      memoryStore.set(domain, {
        domain,
        ...data,
        storedAt: new Date().toISOString(),
      });
      return true;
    }
  } catch (err) {
    console.error('Failed to store collection:', err.message);
    return false;
  }
}

/**
 * Retrieve collection results for a domain
 * @param {string} domain - The domain name
 * @returns {Promise<object|null>} - The stored collection data or null
 */
async function getCollection(domain) {
  try {
    const sanitizedDomain = domain.replace(/[^a-z0-9.-]/gi, '_');
    
    if (useFilesystem) {
      const filePath = path.join(COLLECTIONS_DIR, `${sanitizedDomain}.json`);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } else {
      // In-memory fallback
      return memoryStore.get(domain) || null;
    }
  } catch (err) {
    console.error('Failed to retrieve collection:', err.message);
    return null;
  }
}

/**
 * Check if collection exists for a domain
 * @param {string} domain - The domain name
 * @returns {Promise<boolean>} - Whether collection exists
 */
async function hasCollection(domain) {
  try {
    const sanitizedDomain = domain.replace(/[^a-z0-9.-]/gi, '_');
    
    if (useFilesystem) {
      const filePath = path.join(COLLECTIONS_DIR, `${sanitizedDomain}.json`);
      return fs.existsSync(filePath);
    } else {
      return memoryStore.has(domain);
    }
  } catch (err) {
    return false;
  }
}

/**
 * List all stored collections
 * @returns {Promise<string[]>} - Array of domain names
 */
async function listCollections() {
  try {
    if (useFilesystem) {
      const files = fs.readdirSync(COLLECTIONS_DIR);
      return files
        .filter(f => f.endsWith('.json') && f !== '.test')
        .map(f => f.replace('.json', '').replace(/_/g, '.'));
    } else {
      return Array.from(memoryStore.keys());
    }
  } catch (err) {
    console.error('Failed to list collections:', err.message);
    return [];
  }
}

/**
 * Delete a collection
 * @param {string} domain - The domain name
 * @returns {Promise<boolean>} - Success status
 */
async function deleteCollection(domain) {
  try {
    const sanitizedDomain = domain.replace(/[^a-z0-9.-]/gi, '_');
    
    if (useFilesystem) {
      const filePath = path.join(COLLECTIONS_DIR, `${sanitizedDomain}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    } else {
      memoryStore.delete(domain);
      return true;
    }
  } catch (err) {
    console.error('Failed to delete collection:', err.message);
    return false;
  }
}

module.exports = {
  storeCollection,
  getCollection,
  hasCollection,
  listCollections,
  deleteCollection,
  isUsingFilesystem: () => useFilesystem,
};
