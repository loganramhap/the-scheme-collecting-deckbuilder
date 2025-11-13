import {
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { client, TABLES } from './config.js';

/**
 * Create Users table
 */
async function createUsersTable() {
  const params = {
    TableName: TABLES.USERS,
    KeySchema: [{ AttributeName: 'puuid', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'puuid', AttributeType: 'S' },
      { AttributeName: 'giteaUsername', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GiteaUsernameIndex',
        KeySchema: [{ AttributeName: 'giteaUsername', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    const command = new CreateTableCommand(params);
    await client.send(command);
    console.log(`Creating table ${TABLES.USERS}...`);

    // Wait for table to be active
    await waitUntilTableExists(
      { client, maxWaitTime: 60 },
      { TableName: TABLES.USERS }
    );

    console.log(`✓ Table ${TABLES.USERS} created successfully`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`Table ${TABLES.USERS} already exists`);
    } else {
      throw error;
    }
  }
}

/**
 * Create Sessions table
 */
async function createSessionsTable() {
  const params = {
    TableName: TABLES.SESSIONS,
    KeySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'sessionId', AttributeType: 'S' },
      { AttributeName: 'expiresAt', AttributeType: 'N' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ExpiresAtIndex',
        KeySchema: [{ AttributeName: 'expiresAt', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'KEYS_ONLY' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
    // Enable TTL for automatic session cleanup
    TimeToLiveSpecification: {
      Enabled: true,
      AttributeName: 'expiresAt',
    },
  };

  try {
    const command = new CreateTableCommand(params);
    await client.send(command);
    console.log(`Creating table ${TABLES.SESSIONS}...`);

    // Wait for table to be active
    await waitUntilTableExists(
      { client, maxWaitTime: 60 },
      { TableName: TABLES.SESSIONS }
    );

    console.log(`✓ Table ${TABLES.SESSIONS} created successfully`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`Table ${TABLES.SESSIONS} already exists`);
    } else {
      throw error;
    }
  }
}

/**
 * Verify table exists and is active
 */
async function verifyTable(tableName) {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await client.send(command);
    const status = response.Table.TableStatus;
    console.log(`  ${tableName}: ${status}`);
    return status === 'ACTIVE';
  } catch (error) {
    console.log(`  ${tableName}: NOT FOUND`);
    return false;
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log('=================================');
  console.log('DynamoDB Tables Setup');
  console.log('=================================');
  console.log('');
  console.log(`Region: ${process.env.AWS_REGION}`);
  console.log('');

  try {
    // Check existing tables
    console.log('Checking existing tables...');
    const usersExists = await verifyTable(TABLES.USERS);
    const sessionsExists = await verifyTable(TABLES.SESSIONS);
    console.log('');

    // Create tables if needed
    if (!usersExists) {
      await createUsersTable();
    }

    if (!sessionsExists) {
      await createSessionsTable();
    }

    console.log('');
    console.log('=================================');
    console.log('✓ Setup complete!');
    console.log('=================================');
    console.log('');
    console.log('Table Details:');
    console.log('');
    console.log(`Users Table: ${TABLES.USERS}`);
    console.log('  Primary Key: puuid (String)');
    console.log('  GSI: GiteaUsernameIndex on giteaUsername');
    console.log('');
    console.log(`Sessions Table: ${TABLES.SESSIONS}`);
    console.log('  Primary Key: sessionId (String)');
    console.log('  GSI: ExpiresAtIndex on expiresAt');
    console.log('  TTL: Enabled on expiresAt');
    console.log('');
  } catch (error) {
    console.error('Setup failed:', error.message);
    throw error;
  }
}

// Run setup
setup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
