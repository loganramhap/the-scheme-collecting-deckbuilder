import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['AWS_REGION', 'DYNAMODB_USERS_TABLE', 'DYNAMODB_SESSIONS_TABLE'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Create DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  // Credentials will be loaded from environment variables or IAM role
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
});

// Create Document client for easier data manipulation
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values
    convertEmptyValues: false, // Don't convert empty strings to null
  },
});

// Table names
export const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE,
  SESSIONS: process.env.DYNAMODB_SESSIONS_TABLE,
};

/**
 * Put an item into a table
 * @param {string} tableName - Table name
 * @param {Object} item - Item to put
 * @returns {Promise<Object>} Result
 */
export async function putItem(tableName, item) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  return await docClient.send(command);
}

/**
 * Get an item from a table
 * @param {string} tableName - Table name
 * @param {Object} key - Primary key
 * @returns {Promise<Object|null>} Item or null if not found
 */
export async function getItem(tableName, key) {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });
  const result = await docClient.send(command);
  return result.Item || null;
}

/**
 * Update an item in a table
 * @param {string} tableName - Table name
 * @param {Object} key - Primary key
 * @param {Object} updates - Attributes to update
 * @returns {Promise<Object>} Updated item
 */
export async function updateItem(tableName, key, updates) {
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.keys(updates).forEach((attr, index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = attr;
    expressionAttributeValues[attrValue] = updates[attr];
  });

  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const result = await docClient.send(command);
  return result.Attributes;
}

/**
 * Delete an item from a table
 * @param {string} tableName - Table name
 * @param {Object} key - Primary key
 * @returns {Promise<Object>} Result
 */
export async function deleteItem(tableName, key) {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  });
  return await docClient.send(command);
}

/**
 * Query items from a table
 * @param {string} tableName - Table name
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Items
 */
export async function queryItems(tableName, options) {
  const command = new QueryCommand({
    TableName: tableName,
    ...options,
  });
  const result = await docClient.send(command);
  return result.Items || [];
}

/**
 * Scan items from a table (use sparingly)
 * @param {string} tableName - Table name
 * @param {Object} options - Scan options
 * @returns {Promise<Array>} Items
 */
export async function scanItems(tableName, options = {}) {
  const command = new ScanCommand({
    TableName: tableName,
    ...options,
  });
  const result = await docClient.send(command);
  return result.Items || [];
}

export { docClient, client };
