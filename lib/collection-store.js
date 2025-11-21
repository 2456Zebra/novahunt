// lib/collection-store.js — file-backed collection store for domain search results
const fs = require('fs');
const path = require('path');

const COLLECTIONS_DIR = process.env.NH_COLLECTIONS_DIR || path.join(__dirname, '..', 'data', 'collections');

/**
 * Storage abstraction for collection results
 */
class CollectionStore {
  constructor() {
    this.ensureDirectorySync();
  }

  ensureDirectorySync() {
    try {
      if (!fs.existsSync(COLLECTIONS_DIR)) {
        fs.mkdirSync(COLLECTIONS_DIR, { recursive: true, mode: 0o755 });
      }
    } catch (e) {
      console.warn('collection-store ensure directory error', e?.message || e);
    }
  }

  /**
   * Save a collection result to file system
   * @param {string} domain - The domain that was searched
   * @param {object} data - The collection data to store
   * @param {Array} data.items - Array of normalized email results
   * @param {number} data.total - Total count from Hunter API
   * @param {string} data.collectedAt - ISO timestamp when collection was performed
   * @returns {Promise<boolean>} - Success status
   */
  async save(domain, data) {
    try {
      const filename = this.getFilename(domain);
      const filepath = path.join(COLLECTIONS_DIR, filename);
      
      const payload = {
        domain,
        collectedAt: data.collectedAt || new Date().toISOString(),
        items: data.items || [],
        total: data.total || 0,
        metadata: data.metadata || {}
      };

      await fs.promises.writeFile(filepath, JSON.stringify(payload, null, 2), { mode: 0o644 });
      return true;
    } catch (e) {
      console.error('collection-store save error', e?.message || e);
      return false;
    }
  }

  /**
   * Load a collection result from file system
   * @param {string} domain - The domain to load
   * @returns {Promise<object|null>} - The collection data or null if not found
   */
  async load(domain) {
    try {
      const filename = this.getFilename(domain);
      const filepath = path.join(COLLECTIONS_DIR, filename);
      
      if (!fs.existsSync(filepath)) {
        return null;
      }

      const raw = await fs.promises.readFile(filepath, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('collection-store load error', e?.message || e);
      return null;
    }
  }

  /**
   * Check if a collection exists
   * @param {string} domain - The domain to check
   * @returns {Promise<boolean>} - True if collection exists
   */
  async exists(domain) {
    try {
      const filename = this.getFilename(domain);
      const filepath = path.join(COLLECTIONS_DIR, filename);
      return fs.existsSync(filepath);
    } catch (e) {
      return false;
    }
  }

  /**
   * List all stored collections
   * @returns {Promise<Array<string>>} - Array of domain names
   */
  async list() {
    try {
      this.ensureDirectorySync();
      const files = await fs.promises.readdir(COLLECTIONS_DIR);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (e) {
      console.error('collection-store list error', e?.message || e);
      return [];
    }
  }

  /**
   * Delete a collection
   * @param {string} domain - The domain to delete
   * @returns {Promise<boolean>} - Success status
   */
  async delete(domain) {
    try {
      const filename = this.getFilename(domain);
      const filepath = path.join(COLLECTIONS_DIR, filename);
      
      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
        return true;
      }
      return false;
    } catch (e) {
      console.error('collection-store delete error', e?.message || e);
      return false;
    }
  }

  /**
   * Get the filename for a domain
   * @param {string} domain - The domain
   * @returns {string} - Sanitized filename
   */
  getFilename(domain) {
    // Sanitize domain for filesystem: replace special chars with underscores
    const sanitized = domain.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
    return `${sanitized}.json`;
  }
}

module.exports = CollectionStore;
