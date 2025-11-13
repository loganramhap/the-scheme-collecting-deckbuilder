import { putItem, getItem, deleteItem, TABLES } from '../config.js';

/**
 * Session Repository for DynamoDB operations
 */
class SessionRepository {
  /**
   * Create a new session
   * @param {string} sessionId - Session ID
   * @param {Object} data - Session data
   * @param {number} expirySeconds - Expiry time in seconds (default: 24 hours)
   * @returns {Promise<Object>} Created session
   */
  async create(sessionId, data, expirySeconds = 86400) {
    const now = Date.now();
    const expiresAt = Math.floor(now / 1000) + expirySeconds;

    const session = {
      sessionId,
      data,
      expiresAt,
      createdAt: new Date(now).toISOString(),
    };

    await putItem(TABLES.SESSIONS, session);
    return session;
  }

  /**
   * Find session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} Session or null if not found/expired
   */
  async findById(sessionId) {
    const session = await getItem(TABLES.SESSIONS, { sessionId });

    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt < now) {
      // Session expired, delete it
      await this.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session data
   * @param {string} sessionId - Session ID
   * @param {Object} data - New session data
   * @param {number} expirySeconds - New expiry time in seconds
   * @returns {Promise<Object>} Updated session
   */
  async update(sessionId, data, expirySeconds = 86400) {
    const now = Date.now();
    const expiresAt = Math.floor(now / 1000) + expirySeconds;

    const session = {
      sessionId,
      data,
      expiresAt,
      createdAt: new Date(now).toISOString(),
    };

    await putItem(TABLES.SESSIONS, session);
    return session;
  }

  /**
   * Delete session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async delete(sessionId) {
    await deleteItem(TABLES.SESSIONS, { sessionId });
  }

  /**
   * Extend session expiry
   * @param {string} sessionId - Session ID
   * @param {number} expirySeconds - Additional seconds to extend
   * @returns {Promise<Object|null>} Updated session or null if not found
   */
  async extend(sessionId, expirySeconds = 86400) {
    const session = await this.findById(sessionId);

    if (!session) {
      return null;
    }

    return await this.update(sessionId, session.data, expirySeconds);
  }
}

export default new SessionRepository();
