import { TABLES, scanItems, deleteItem } from '../db/config.js';

/**
 * Cleanup Service
 * Handles background cleanup tasks for expired sessions
 */

/**
 * Clean up expired sessions from the database
 * Note: DynamoDB TTL will automatically delete expired sessions,
 * but this provides immediate cleanup and statistics
 * 
 * @returns {Promise<Object>} Cleanup statistics
 */
export async function cleanupExpiredSessions() {
  const startTime = Date.now();
  let deletedCount = 0;
  let scannedCount = 0;
  let errorCount = 0;
  
  try {
    console.log('[Cleanup] Starting expired session cleanup...');
    
    const now = Math.floor(Date.now() / 1000); // Current time in Unix timestamp
    
    // Scan sessions table for expired sessions
    const sessions = await scanItems(TABLES.SESSIONS);
    scannedCount = sessions.length;
    
    console.log(`[Cleanup] Scanned ${scannedCount} sessions`);
    
    // Filter expired sessions
    const expiredSessions = sessions.filter(session => {
      return session.expiresAt && session.expiresAt < now;
    });
    
    console.log(`[Cleanup] Found ${expiredSessions.length} expired sessions`);
    
    // Delete expired sessions
    for (const session of expiredSessions) {
      try {
        await deleteItem(TABLES.SESSIONS, { sessionId: session.sessionId });
        deletedCount++;
      } catch (error) {
        console.error(`[Cleanup] Failed to delete session ${session.sessionId}:`, error.message);
        errorCount++;
      }
    }
    
    const duration = Date.now() - startTime;
    
    const stats = {
      timestamp: new Date().toISOString(),
      scannedCount,
      deletedCount,
      errorCount,
      durationMs: duration,
    };
    
    console.log('[Cleanup] Session cleanup completed:', stats);
    
    return stats;
  } catch (error) {
    console.error('[Cleanup] Session cleanup failed:', error);
    throw error;
  }
}

/**
 * Start periodic cleanup job
 * Runs cleanup every hour
 * 
 * @returns {NodeJS.Timeout} Interval timer
 */
export function startCleanupJob() {
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
  
  console.log('[Cleanup] Starting periodic cleanup job (runs every hour)');
  
  // Run cleanup immediately on startup
  cleanupExpiredSessions().catch(error => {
    console.error('[Cleanup] Initial cleanup failed:', error);
  });
  
  // Schedule periodic cleanup
  const intervalId = setInterval(async () => {
    try {
      await cleanupExpiredSessions();
    } catch (error) {
      console.error('[Cleanup] Scheduled cleanup failed:', error);
    }
  }, CLEANUP_INTERVAL);
  
  // Return interval ID so it can be cleared if needed
  return intervalId;
}

/**
 * Stop cleanup job
 * 
 * @param {NodeJS.Timeout} intervalId - Interval timer to clear
 */
export function stopCleanupJob(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('[Cleanup] Cleanup job stopped');
  }
}

/**
 * Get cleanup statistics for monitoring
 * 
 * @returns {Promise<Object>} Current session statistics
 */
export async function getSessionStats() {
  try {
    const sessions = await scanItems(TABLES.SESSIONS);
    const now = Math.floor(Date.now() / 1000);
    
    const activeSessions = sessions.filter(s => s.expiresAt >= now);
    const expiredSessions = sessions.filter(s => s.expiresAt < now);
    
    return {
      total: sessions.length,
      active: activeSessions.length,
      expired: expiredSessions.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Cleanup] Failed to get session stats:', error);
    throw error;
  }
}

export default {
  cleanupExpiredSessions,
  startCleanupJob,
  stopCleanupJob,
  getSessionStats,
};
