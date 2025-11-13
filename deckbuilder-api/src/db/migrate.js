import {
  CreateTableCommand,
  DescribeTableCommand,
  UpdateTimeToLiveCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { client, TABLES } from './config.js';

/**
 * Migration script for DynamoDB tables
 * This script creates or updates tables to match the current schema
 */

/**
 * Create or verify Users table
 */
async function migrateUsersTable() {
  console.log(`\nMigrating Users table: ${TABLES.USERS}`);
  console.log('-----------------------------------');

  try {
    // Check if table exists
    const describeCommand = new DescribeTableCommand({ TableName: TABLES.USERS });
    const existingTable = await client.send(describeCommand);
    
    console.log('✓ Table already exists');
    console.log(`  Status: ${existingTable.Table.TableStatus}`);
    console.log(`  Item count: ${existingTable.Table.ItemCount}`);
    
    // Verify indexes
    const hasGiteaIndex = existingTable.Table.GlobalSecondaryIndexes?.some(
      (index) => index.IndexName === 'GiteaUsernameIndex'
    );
    
    if (hasGiteaIndex) {
      console.log('✓ GiteaUsernameIndex exists');
    } else {
      console.log('⚠ Warning: GiteaUsernameIndex not found');
      console.log('  This index is required for user lookups');
    }
    
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('Table does not exist, creating...');
      
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

      const createCommand = new CreateTableCommand(params);
      await client.send(createCommand);
      console.log('Creating table...');

      // Wait for table to be active
      await waitUntilTableExists(
        { client, maxWaitTime: 60 },
        { TableName: TABLES.USERS }
      );

      console.log('✓ Table created successfully');
      return true;
    } else {
      throw error;
    }
  }
}

/**
 * Create or verify Sessions table
 */
async function migrateSessionsTable() {
  console.log(`\nMigrating Sessions table: ${TABLES.SESSIONS}`);
  console.log('-----------------------------------');

  try {
    // Check if table exists
    const describeCommand = new DescribeTableCommand({ TableName: TABLES.SESSIONS });
    const existingTable = await client.send(describeCommand);
    
    console.log('✓ Table already exists');
    console.log(`  Status: ${existingTable.Table.TableStatus}`);
    console.log(`  Item count: ${existingTable.Table.ItemCount}`);
    
    // Verify TTL
    const ttlEnabled = existingTable.Table.TimeToLiveDescription?.TimeToLiveStatus === 'ENABLED';
    if (ttlEnabled) {
      console.log('✓ TTL enabled on expiresAt');
    } else {
      console.log('⚠ Warning: TTL not enabled');
      console.log('  Enabling TTL for automatic session cleanup...');
      
      try {
        const ttlCommand = new UpdateTimeToLiveCommand({
          TableName: TABLES.SESSIONS,
          TimeToLiveSpecification: {
            Enabled: true,
            AttributeName: 'expiresAt',
          },
        });
        await client.send(ttlCommand);
        console.log('✓ TTL enabled');
      } catch (ttlError) {
        console.log('⚠ Could not enable TTL:', ttlError.message);
      }
    }
    
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('Table does not exist, creating...');
      
      const params = {
        TableName: TABLES.SESSIONS,
        KeySchema: [{ AttributeName: 'sessionId', KeyType: 'HASH' }],
        AttributeDefinitions: [
          { AttributeName: 'sessionId', AttributeType: 'S' },
        ],
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      };

      const createCommand = new CreateTableCommand(params);
      await client.send(createCommand);
      console.log('Creating table...');

      // Wait for table to be active
      await waitUntilTableExists(
        { client, maxWaitTime: 60 },
        { TableName: TABLES.SESSIONS }
      );

      console.log('✓ Table created successfully');
      
      // Enable TTL
      console.log('Enabling TTL...');
      const ttlCommand = new UpdateTimeToLiveCommand({
        TableName: TABLES.SESSIONS,
        TimeToLiveSpecification: {
          Enabled: true,
          AttributeName: 'expiresAt',
        },
      });
      await client.send(ttlCommand);
      console.log('✓ TTL enabled');
      
      return true;
    } else {
      throw error;
    }
  }
}

/**
 * Verify table structure
 */
async function verifyTables() {
  console.log('\nVerifying table structure...');
  console.log('===================================');
  
  try {
    // Verify Users table
    const usersCommand = new DescribeTableCommand({ TableName: TABLES.USERS });
    const usersTable = await client.send(usersCommand);
    
    console.log(`\n${TABLES.USERS}:`);
    console.log(`  Status: ${usersTable.Table.TableStatus}`);
    console.log(`  Items: ${usersTable.Table.ItemCount}`);
    console.log(`  Size: ${(usersTable.Table.TableSizeBytes / 1024).toFixed(2)} KB`);
    console.log(`  Read capacity: ${usersTable.Table.ProvisionedThroughput.ReadCapacityUnits}`);
    console.log(`  Write capacity: ${usersTable.Table.ProvisionedThroughput.WriteCapacityUnits}`);
    
    // Verify Sessions table
    const sessionsCommand = new DescribeTableCommand({ TableName: TABLES.SESSIONS });
    const sessionsTable = await client.send(sessionsCommand);
    
    console.log(`\n${TABLES.SESSIONS}:`);
    console.log(`  Status: ${sessionsTable.Table.TableStatus}`);
    console.log(`  Items: ${sessionsTable.Table.ItemCount}`);
    console.log(`  Size: ${(sessionsTable.Table.TableSizeBytes / 1024).toFixed(2)} KB`);
    console.log(`  Read capacity: ${sessionsTable.Table.ProvisionedThroughput.ReadCapacityUnits}`);
    console.log(`  Write capacity: ${sessionsTable.Table.ProvisionedThroughput.WriteCapacityUnits}`);
    console.log(`  TTL: ${sessionsTable.Table.TimeToLiveDescription?.TimeToLiveStatus || 'DISABLED'}`);
    
    return true;
  } catch (error) {
    console.error('Error verifying tables:', error.message);
    return false;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('===================================');
  console.log('DynamoDB Migration Script');
  console.log('===================================');
  console.log(`Region: ${process.env.AWS_REGION}`);
  console.log('');

  try {
    // Migrate tables
    await migrateUsersTable();
    await migrateSessionsTable();
    
    // Verify structure
    await verifyTables();
    
    console.log('\n===================================');
    console.log('✓ Migration complete!');
    console.log('===================================\n');
    
    return true;
  } catch (error) {
    console.error('\n===================================');
    console.error('✗ Migration failed!');
    console.error('===================================');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. AWS credentials are configured correctly');
    console.error('2. IAM user has DynamoDB permissions');
    console.error('3. Region is set correctly');
    console.error('4. Table names are valid');
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrate, migrateUsersTable, migrateSessionsTable, verifyTables };
