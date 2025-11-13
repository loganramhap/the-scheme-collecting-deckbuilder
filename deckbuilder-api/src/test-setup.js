import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set test environment variables if not already set
if (!process.env.AWS_REGION) {
  process.env.AWS_REGION = 'us-east-1';
}

if (!process.env.DYNAMODB_USERS_TABLE) {
  process.env.DYNAMODB_USERS_TABLE = 'test-users';
}

if (!process.env.DYNAMODB_SESSIONS_TABLE) {
  process.env.DYNAMODB_SESSIONS_TABLE = 'test-sessions';
}

if (!process.env.ENCRYPTION_KEY) {
  // Generate a test encryption key (32 bytes = 64 hex characters)
  process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test-session-secret';
}

if (!process.env.SESSION_EXPIRY) {
  process.env.SESSION_EXPIRY = '86400';
}

if (!process.env.RIOT_CLIENT_ID) {
  process.env.RIOT_CLIENT_ID = 'test-client-id';
}

if (!process.env.RIOT_CLIENT_SECRET) {
  process.env.RIOT_CLIENT_SECRET = 'test-client-secret';
}

if (!process.env.RIOT_REDIRECT_URI) {
  process.env.RIOT_REDIRECT_URI = 'http://localhost:5173/auth/callback';
}

if (!process.env.RIOT_AUTHORIZATION_URL) {
  process.env.RIOT_AUTHORIZATION_URL = 'https://auth.riotgames.com/authorize';
}

if (!process.env.RIOT_TOKEN_URL) {
  process.env.RIOT_TOKEN_URL = 'https://auth.riotgames.com/token';
}

if (!process.env.RIOT_USERINFO_URL) {
  process.env.RIOT_USERINFO_URL = 'https://auth.riotgames.com/userinfo';
}

if (!process.env.GITEA_URL) {
  process.env.GITEA_URL = 'http://localhost:3000';
}

if (!process.env.GITEA_ADMIN_TOKEN) {
  process.env.GITEA_ADMIN_TOKEN = 'test-admin-token';
}

console.log('Test environment configured');
