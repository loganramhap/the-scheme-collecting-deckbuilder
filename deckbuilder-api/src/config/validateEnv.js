/**
 * Environment variable validation
 * Ensures all required configuration is present before starting the server
 */

const requiredEnvVars = [
  // Riot OAuth
  'RIOT_CLIENT_ID',
  'RIOT_CLIENT_SECRET',
  'RIOT_REDIRECT_URI',
  'RIOT_AUTHORIZATION_URL',
  'RIOT_TOKEN_URL',
  'RIOT_USERINFO_URL',
  'RIOT_REVOKE_URL',
  
  // Session
  'SESSION_SECRET',
  'SESSION_EXPIRY',
  
  // Encryption
  'ENCRYPTION_KEY',
  
  // Gitea
  'GITEA_URL',
  'GITEA_ADMIN_TOKEN',
  
  // AWS
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  
  // DynamoDB
  'DYNAMODB_USERS_TABLE',
  'DYNAMODB_SESSIONS_TABLE',
  
  // Frontend
  'FRONTEND_URL',
];

const optionalEnvVars = [
  'PORT',
];

/**
 * Validate that all required environment variables are set
 * @throws {Error} If any required variables are missing
 */
export function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check for placeholder values that need to be replaced
  const placeholders = [
    { var: 'RIOT_CLIENT_ID', placeholder: 'your_riot_client_id' },
    { var: 'RIOT_CLIENT_SECRET', placeholder: 'your_riot_client_secret' },
    { var: 'SESSION_SECRET', placeholder: 'your_session_secret_here' },
    { var: 'ENCRYPTION_KEY', placeholder: 'your_encryption_key_here' },
    { var: 'GITEA_ADMIN_TOKEN', placeholder: 'your_admin_token_here' },
    { var: 'AWS_ACCESS_KEY_ID', placeholder: 'your_access_key_id' },
    { var: 'AWS_SECRET_ACCESS_KEY', placeholder: 'your_secret_access_key' },
  ];

  for (const { var: varName, placeholder } of placeholders) {
    if (process.env[varName] === placeholder) {
      warnings.push(`${varName} is still set to placeholder value "${placeholder}"`);
    }
  }

  // Validate specific formats
  if (process.env.RIOT_REDIRECT_URI && !process.env.RIOT_REDIRECT_URI.startsWith('http')) {
    warnings.push('RIOT_REDIRECT_URI should be a valid HTTP(S) URL');
  }

  if (process.env.SESSION_EXPIRY && isNaN(parseInt(process.env.SESSION_EXPIRY))) {
    warnings.push('SESSION_EXPIRY should be a number (seconds)');
  }

  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
    warnings.push('ENCRYPTION_KEY should be at least 32 characters for AES-256');
  }

  // Report results
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease set these variables in your .env file');
    console.error('See .env.example for reference\n');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment configuration warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
    console.warn('');
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get environment variable with fallback
 * @param {string} name - Variable name
 * @param {string} defaultValue - Default value if not set
 * @returns {string}
 */
export function getEnv(name, defaultValue = '') {
  return process.env[name] || defaultValue;
}

/**
 * Get required environment variable
 * @param {string} name - Variable name
 * @throws {Error} If variable is not set
 * @returns {string}
 */
export function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}
