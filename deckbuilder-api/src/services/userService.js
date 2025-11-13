import crypto from 'crypto';
import axios from 'axios';
import { TABLES, getItem, putItem, updateItem, queryItems } from '../db/config.js';

/**
 * User Service
 * Handles user account management and Gitea provisioning
 */

/**
 * Find user by PUUID
 * @param {string} puuid - Riot PUUID
 * @returns {Promise<Object|null>} User record or null if not found
 */
export async function findUserByPuuid(puuid) {
  try {
    const user = await getItem(TABLES.USERS, { puuid });
    return user;
  } catch (error) {
    console.error('Error finding user by PUUID:', error);
    throw new Error('Failed to find user');
  }
}

/**
 * Find user by Gitea username
 * @param {string} giteaUsername - Gitea username
 * @returns {Promise<Object|null>} User record or null if not found
 */
export async function findUserByGiteaUsername(giteaUsername) {
  try {
    const users = await queryItems(TABLES.USERS, {
      IndexName: 'GiteaUsernameIndex',
      KeyConditionExpression: 'giteaUsername = :username',
      ExpressionAttributeValues: {
        ':username': giteaUsername,
      },
    });
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error finding user by Gitea username:', error);
    throw new Error('Failed to find user');
  }
}

/**
 * Generate unique Gitea username from game name and tag
 * @param {string} gameName - Riot game name
 * @param {string} tagLine - Riot tag line
 * @returns {Promise<string>} Unique Gitea username
 */
export async function generateGiteaUsername(gameName, tagLine) {
  // Sanitize game name: lowercase, remove special characters, replace spaces with hyphens
  const sanitizedName = gameName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Sanitize tag line
  const sanitizedTag = tagLine
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10); // Limit tag length
  
  // Base username
  let username = `${sanitizedName}-${sanitizedTag}`;
  
  // Ensure username is not too long (Gitea has limits)
  if (username.length > 39) {
    username = username.substring(0, 39);
  }
  
  // Check if username exists, add suffix if needed
  let finalUsername = username;
  let suffix = 1;
  
  while (true) {
    const existingUser = await findUserByGiteaUsername(finalUsername);
    if (!existingUser) {
      break;
    }
    finalUsername = `${username}-${suffix}`;
    suffix++;
    
    // Prevent infinite loop
    if (suffix > 100) {
      throw new Error('Unable to generate unique username');
    }
  }
  
  return finalUsername;
}

/**
 * Generate secure random password
 * @param {number} length - Password length (default 32)
 * @returns {string} Random password
 */
export function generateSecurePassword(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}

/**
 * Encrypt password using AES-256-GCM
 * @param {string} password - Plain text password
 * @returns {string} Encrypted password (format: iv:authTag:encrypted)
 */
export function encryptPassword(password) {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt password using AES-256-GCM
 * @param {string} encryptedPassword - Encrypted password (format: iv:authTag:encrypted)
 * @returns {string} Plain text password
 */
export function decryptPassword(encryptedPassword) {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const parts = encryptedPassword.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted password format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Provision new Gitea account
 * @param {string} username - Gitea username
 * @param {string} password - Gitea password
 * @param {string} email - User email (optional, can use placeholder)
 * @returns {Promise<void>}
 */
export async function provisionGiteaAccount(username, password, email = null) {
  const GITEA_URL = process.env.GITEA_URL;
  const GITEA_ADMIN_TOKEN = process.env.GITEA_ADMIN_TOKEN;
  
  if (!GITEA_URL || !GITEA_ADMIN_TOKEN) {
    throw new Error('Gitea configuration missing');
  }
  
  // Use placeholder email if not provided
  const userEmail = email || `${username}@zauniteworkshop.local`;
  
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `${GITEA_URL}/api/v1/admin/users`,
        {
          username,
          email: userEmail,
          password,
          must_change_password: false,
          send_notify: false,
        },
        {
          headers: {
            Authorization: `token ${GITEA_ADMIN_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      
      console.log(`Gitea account created for user: ${username}`);
      return;
    } catch (error) {
      lastError = error;
      
      // Don't retry if user already exists
      if (error.response?.status === 422 || error.response?.status === 409) {
        console.log(`Gitea account already exists for: ${username}`);
        return;
      }
      
      console.error(`Gitea provisioning attempt ${attempt} failed:`, error.response?.data || error.message);
      
      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await sleep(delay);
      }
    }
  }
  
  throw new Error(`Failed to provision Gitea account after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Create new user with Gitea provisioning
 * @param {Object} riotUser - Riot user info (puuid, gameName, tagLine)
 * @returns {Promise<Object>} Created user record
 */
export async function createUser(riotUser) {
  const { puuid, gameName, tagLine } = riotUser;
  
  try {
    // Check if user already exists
    const existingUser = await findUserByPuuid(puuid);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Generate unique Gitea username
    const giteaUsername = await generateGiteaUsername(gameName, tagLine);
    
    // Generate secure password
    const giteaPassword = generateSecurePassword();
    
    // Provision Gitea account
    await provisionGiteaAccount(giteaUsername, giteaPassword);
    
    // Encrypt password before storing
    const encryptedPassword = encryptPassword(giteaPassword);
    
    // Create user record
    const now = new Date().toISOString();
    const userRecord = {
      puuid,
      giteaUsername,
      giteaPasswordEncrypted: encryptedPassword,
      gameName,
      tagLine,
      createdAt: now,
      lastLogin: now,
    };
    
    await putItem(TABLES.USERS, userRecord);
    
    console.log(`User created: ${puuid} -> ${giteaUsername}`);
    
    return userRecord;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update user's last login timestamp
 * @param {string} puuid - Riot PUUID
 * @returns {Promise<Object>} Updated user record
 */
export async function updateLastLogin(puuid) {
  try {
    const now = new Date().toISOString();
    const updatedUser = await updateItem(
      TABLES.USERS,
      { puuid },
      { lastLogin: now }
    );
    return updatedUser;
  } catch (error) {
    console.error('Error updating last login:', error);
    throw new Error('Failed to update last login');
  }
}

/**
 * Link existing Gitea account to Riot account
 * @param {string} puuid - Riot PUUID
 * @param {string} giteaUsername - Existing Gitea username
 * @param {string} giteaPassword - Existing Gitea password
 * @param {string} gameName - Riot game name
 * @param {string} tagLine - Riot tag line
 * @returns {Promise<Object>} Created user record
 */
export async function linkExistingGiteaAccount(puuid, giteaUsername, giteaPassword, gameName, tagLine) {
  try {
    // Check if user already exists
    const existingUser = await findUserByPuuid(puuid);
    if (existingUser) {
      throw new Error('User already linked');
    }
    
    // Encrypt password
    const encryptedPassword = encryptPassword(giteaPassword);
    
    // Create user record
    const now = new Date().toISOString();
    const userRecord = {
      puuid,
      giteaUsername,
      giteaPasswordEncrypted: encryptedPassword,
      gameName,
      tagLine,
      createdAt: now,
      lastLogin: now,
    };
    
    await putItem(TABLES.USERS, userRecord);
    
    console.log(`Existing Gitea account linked: ${puuid} -> ${giteaUsername}`);
    
    return userRecord;
  } catch (error) {
    console.error('Error linking Gitea account:', error);
    throw error;
  }
}

/**
 * Helper function to sleep
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Default export with all methods
export default {
  findUserByPuuid,
  findUserByGiteaUsername,
  generateGiteaUsername,
  generateSecurePassword,
  encryptPassword,
  decryptPassword,
  provisionGiteaAccount,
  createUser,
  updateLastLogin,
  linkExistingGiteaAccount,
};
