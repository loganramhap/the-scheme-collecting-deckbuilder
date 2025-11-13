import { putItem, getItem, updateItem, queryItems, TABLES } from '../config.js';

/**
 * User Repository for DynamoDB operations
 */
class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    const user = {
      puuid: userData.puuid,
      giteaUsername: userData.giteaUsername,
      giteaPasswordEncrypted: userData.giteaPasswordEncrypted,
      gameName: userData.gameName,
      tagLine: userData.tagLine,
      summonerIcon: userData.summonerIcon || null,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    await putItem(TABLES.USERS, user);
    return user;
  }

  /**
   * Find user by PUUID
   * @param {string} puuid - Player UUID
   * @returns {Promise<Object|null>} User or null
   */
  async findByPuuid(puuid) {
    return await getItem(TABLES.USERS, { puuid });
  }

  /**
   * Find user by Gitea username
   * @param {string} giteaUsername - Gitea username
   * @returns {Promise<Object|null>} User or null
   */
  async findByGiteaUsername(giteaUsername) {
    const items = await queryItems(TABLES.USERS, {
      IndexName: 'GiteaUsernameIndex',
      KeyConditionExpression: 'giteaUsername = :username',
      ExpressionAttributeValues: {
        ':username': giteaUsername,
      },
    });

    return items.length > 0 ? items[0] : null;
  }

  /**
   * Update user
   * @param {string} puuid - Player UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  async update(puuid, updates) {
    return await updateItem(TABLES.USERS, { puuid }, updates);
  }

  /**
   * Update last login timestamp
   * @param {string} puuid - Player UUID
   * @returns {Promise<Object>} Updated user
   */
  async updateLastLogin(puuid) {
    return await this.update(puuid, {
      lastLogin: new Date().toISOString(),
    });
  }

  /**
   * Update Gitea password
   * @param {string} puuid - Player UUID
   * @param {string} encryptedPassword - Encrypted password
   * @returns {Promise<Object>} Updated user
   */
  async updateGiteaPassword(puuid, encryptedPassword) {
    return await this.update(puuid, {
      giteaPasswordEncrypted: encryptedPassword,
    });
  }
}

export default new UserRepository();
