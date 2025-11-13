import {
  CreateBackupCommand,
  ListBackupsCommand,
  DescribeBackupCommand,
  DeleteBackupCommand,
} from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { client, docClient, TABLES } from './config.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Database backup utilities for DynamoDB tables
 */

/**
 * Create an on-demand backup of a table
 * @param {string} tableName - Table to backup
 * @returns {Promise<Object>} Backup details
 */
async function createBackup(tableName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${tableName}-backup-${timestamp}`;
  
  console.log(`Creating backup: ${backupName}`);
  
  const command = new CreateBackupCommand({
    TableName: tableName,
    BackupName: backupName,
  });
  
  const result = await client.send(command);
  console.log(`✓ Backup created: ${result.BackupDetails.BackupArn}`);
  
  return result.BackupDetails;
}

/**
 * List all backups for a table
 * @param {string} tableName - Table name
 * @returns {Promise<Array>} List of backups
 */
async function listBackups(tableName) {
  const command = new ListBackupsCommand({
    TableName: tableName,
  });
  
  const result = await client.send(command);
  return result.BackupSummaries || [];
}

/**
 * Get backup details
 * @param {string} backupArn - Backup ARN
 * @returns {Promise<Object>} Backup details
 */
async function getBackupDetails(backupArn) {
  const command = new DescribeBackupCommand({
    BackupArn: backupArn,
  });
  
  const result = await client.send(command);
  return result.BackupDescription;
}

/**
 * Delete a backup
 * @param {string} backupArn - Backup ARN
 * @returns {Promise<Object>} Result
 */
async function deleteBackup(backupArn) {
  const command = new DeleteBackupCommand({
    BackupArn: backupArn,
  });
  
  return await client.send(command);
}

/**
 * Export table data to JSON file
 * @param {string} tableName - Table to export
 * @param {string} outputDir - Output directory
 * @returns {Promise<string>} Output file path
 */
async function exportToJSON(tableName, outputDir = './backups') {
  console.log(`Exporting ${tableName} to JSON...`);
  
  // Create output directory
  await mkdir(outputDir, { recursive: true });
  
  // Scan all items
  const items = [];
  let lastEvaluatedKey = undefined;
  
  do {
    const command = new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey,
    });
    
    const result = await docClient.send(command);
    items.push(...(result.Items || []));
    lastEvaluatedKey = result.LastEvaluatedKey;
    
    console.log(`  Scanned ${items.length} items...`);
  } while (lastEvaluatedKey);
  
  // Write to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${tableName}-${timestamp}.json`;
  const filepath = join(outputDir, filename);
  
  await writeFile(filepath, JSON.stringify(items, null, 2));
  
  console.log(`✓ Exported ${items.length} items to ${filepath}`);
  return filepath;
}

/**
 * Backup all tables
 */
async function backupAll() {
  console.log('===================================');
  console.log('DynamoDB Backup Script');
  console.log('===================================');
  console.log(`Region: ${process.env.AWS_REGION}`);
  console.log('');
  
  const results = {
    users: null,
    sessions: null,
  };
  
  try {
    // Backup Users table
    console.log('\nBacking up Users table...');
    console.log('-----------------------------------');
    results.users = await createBackup(TABLES.USERS);
    
    // Backup Sessions table
    console.log('\nBacking up Sessions table...');
    console.log('-----------------------------------');
    results.sessions = await createBackup(TABLES.SESSIONS);
    
    console.log('\n===================================');
    console.log('✓ Backup complete!');
    console.log('===================================');
    console.log('\nBackup ARNs:');
    console.log(`  Users: ${results.users.BackupArn}`);
    console.log(`  Sessions: ${results.sessions.BackupArn}`);
    console.log('');
    
    return results;
  } catch (error) {
    console.error('\n===================================');
    console.error('✗ Backup failed!');
    console.error('===================================');
    console.error('Error:', error.message);
    throw error;
  }
}

/**
 * Export all tables to JSON
 */
async function exportAll(outputDir = './backups') {
  console.log('===================================');
  console.log('DynamoDB Export Script');
  console.log('===================================');
  console.log(`Region: ${process.env.AWS_REGION}`);
  console.log(`Output: ${outputDir}`);
  console.log('');
  
  const results = {
    users: null,
    sessions: null,
  };
  
  try {
    // Export Users table
    console.log('\nExporting Users table...');
    console.log('-----------------------------------');
    results.users = await exportToJSON(TABLES.USERS, outputDir);
    
    // Export Sessions table
    console.log('\nExporting Sessions table...');
    console.log('-----------------------------------');
    results.sessions = await exportToJSON(TABLES.SESSIONS, outputDir);
    
    console.log('\n===================================');
    console.log('✓ Export complete!');
    console.log('===================================');
    console.log('\nExported files:');
    console.log(`  Users: ${results.users}`);
    console.log(`  Sessions: ${results.sessions}`);
    console.log('');
    
    return results;
  } catch (error) {
    console.error('\n===================================');
    console.error('✗ Export failed!');
    console.error('===================================');
    console.error('Error:', error.message);
    throw error;
  }
}

/**
 * List all backups
 */
async function listAllBackups() {
  console.log('===================================');
  console.log('DynamoDB Backups');
  console.log('===================================');
  console.log('');
  
  try {
    // List Users table backups
    console.log(`Backups for ${TABLES.USERS}:`);
    console.log('-----------------------------------');
    const usersBackups = await listBackups(TABLES.USERS);
    
    if (usersBackups.length === 0) {
      console.log('  No backups found');
    } else {
      usersBackups.forEach((backup) => {
        const date = new Date(backup.BackupCreationDateTime).toLocaleString();
        const size = (backup.BackupSizeBytes / 1024 / 1024).toFixed(2);
        console.log(`  ${backup.BackupName}`);
        console.log(`    Created: ${date}`);
        console.log(`    Size: ${size} MB`);
        console.log(`    Status: ${backup.BackupStatus}`);
        console.log('');
      });
    }
    
    // List Sessions table backups
    console.log(`\nBackups for ${TABLES.SESSIONS}:`);
    console.log('-----------------------------------');
    const sessionsBackups = await listBackups(TABLES.SESSIONS);
    
    if (sessionsBackups.length === 0) {
      console.log('  No backups found');
    } else {
      sessionsBackups.forEach((backup) => {
        const date = new Date(backup.BackupCreationDateTime).toLocaleString();
        const size = (backup.BackupSizeBytes / 1024 / 1024).toFixed(2);
        console.log(`  ${backup.BackupName}`);
        console.log(`    Created: ${date}`);
        console.log(`    Size: ${size} MB`);
        console.log(`    Status: ${backup.BackupStatus}`);
        console.log('');
      });
    }
    
    console.log('===================================');
  } catch (error) {
    console.error('Error listing backups:', error.message);
    throw error;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      backupAll()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error);
          process.exit(1);
        });
      break;
      
    case 'export':
      const outputDir = process.argv[3] || './backups';
      exportAll(outputDir)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error);
          process.exit(1);
        });
      break;
      
    case 'list':
      listAllBackups()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error(error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('Usage:');
      console.log('  node backup.js create              - Create on-demand backups');
      console.log('  node backup.js export [dir]        - Export tables to JSON');
      console.log('  node backup.js list                - List all backups');
      process.exit(1);
  }
}

export {
  createBackup,
  listBackups,
  getBackupDetails,
  deleteBackup,
  exportToJSON,
  backupAll,
  exportAll,
  listAllBackups,
};
