import express from 'express';
import { authenticateToken } from '../../middleware/auth';
import { DatabaseService } from '../../services/database.service';
import { BackupService } from '../../services/backup.service';
import { MonitoringService } from '../../services/monitoring.service';

const router = express.Router();

// Middleware to check admin privileges
const adminMiddleware = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

// Get database health status
router.get('/health', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const dbService = DatabaseService.getInstance();
    const healthStatus = await dbService.performHealthCheck();
    
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        ...healthStatus,
      },
    });
  } catch (error: any) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message,
    });
  }
});

// Get database metrics
router.get('/metrics', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const monitoringService = MonitoringService.getInstance();
    
    const metrics = monitoringService.getMetricsHistory(hours);
    
    res.json({
      success: true,
      data: {
        period: `${hours} hours`,
        metrics,
        count: metrics.length,
      },
    });
  } catch (error: any) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      details: error.message,
    });
  }
});

// Get current alerts
router.get('/alerts', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const monitoringService = MonitoringService.getInstance();
    const currentAlerts = monitoringService.getCurrentAlerts();
    const alertHistory = monitoringService.getAlertHistory();
    
    res.json({
      success: true,
      data: {
        current: currentAlerts,
        history: alertHistory,
        summary: {
          total: alertHistory.length,
          active: currentAlerts.length,
          resolved: alertHistory.filter(a => a.resolved).length,
        },
      },
    });
  } catch (error: any) {
    console.error('Failed to get alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
      details: error.message,
    });
  }
});

// Generate monitoring report
router.get('/report', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const monitoringService = MonitoringService.getInstance();
    
    const report = await monitoringService.generateReport(hours);
    
    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Failed to generate report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      details: error.message,
    });
  }
});

// Optimize database
router.post('/optimize', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const dbService = DatabaseService.getInstance();
    const result = await dbService.optimizeDatabase();
    
    res.json({
      success: true,
      data: result,
      message: 'Database optimization completed',
    });
  } catch (error: any) {
    console.error('Database optimization failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database optimization failed',
      details: error.message,
    });
  }
});

// Create backup
router.post('/backup', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { type = 'manual' } = req.body;
    const backupService = BackupService.getInstance();
    
    const result = await backupService.createFullBackup(type);
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Backup created successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Backup creation failed',
        details: result.error,
      });
    }
  } catch (error: any) {
    console.error('Backup creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Backup creation failed',
      details: error.message,
    });
  }
});

// Get backup list
router.get('/backups', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const backupService = BackupService.getInstance();
    const backups = await backupService.getBackupList();
    
    res.json({
      success: true,
      data: backups,
      count: backups.length,
    });
  } catch (error: any) {
    console.error('Failed to get backup list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backup list',
      details: error.message,
    });
  }
});

// Validate backup
router.get('/backups/:backupId/validate', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { backupId } = req.params;
    const backupService = BackupService.getInstance();
    
    const validation = await backupService.validateBackup(backupId);
    
    res.json({
      success: true,
      data: validation,
    });
  } catch (error: any) {
    console.error('Backup validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Backup validation failed',
      details: error.message,
    });
  }
});

// Restore from backup
router.post('/restore/:backupId', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { backupId } = req.params;
    const { confirm } = req.body;
    
    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required for database restore',
        message: 'This operation will overwrite the current database. Set confirm=true to proceed.',
      });
    }
    
    const backupService = BackupService.getInstance();
    const result = await backupService.restoreFromBackup(backupId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Database restored successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Database restore failed',
        details: result.error,
      });
    }
  } catch (error: any) {
    console.error('Database restore failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database restore failed',
      details: error.message,
    });
  }
});

// Cleanup old backups
router.post('/backups/cleanup', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const backupService = BackupService.getInstance();
    const result = await backupService.cleanupOldBackups();
    
    res.json({
      success: true,
      data: result,
      message: `Cleanup completed: ${result.deleted} files deleted`,
    });
  } catch (error: any) {
    console.error('Backup cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Backup cleanup failed',
      details: error.message,
    });
  }
});

// Get backup configuration
router.get('/backup/config', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const backupService = BackupService.getInstance();
    const config = backupService.getConfig();
    
    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('Failed to get backup config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backup configuration',
      details: error.message,
    });
  }
});

// Update backup configuration
router.put('/backup/config', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const backupService = BackupService.getInstance();
    const newConfig = req.body;
    
    // Validate configuration
    const validFields = [
      'enabled', 'schedule', 'retentionDays', 'location',
      'compression', 'encryption', 'cloudUpload', 'notifications'
    ];
    
    const updates: any = {};
    for (const field of validFields) {
      if (newConfig[field] !== undefined) {
        updates[field] = newConfig[field];
      }
    }
    
    backupService.updateConfig(updates);
    
    res.json({
      success: true,
      data: backupService.getConfig(),
      message: 'Backup configuration updated',
    });
  } catch (error: any) {
    console.error('Failed to update backup config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update backup configuration',
      details: error.message,
    });
  }
});

// Get monitoring configuration
router.get('/monitoring/config', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const monitoringService = MonitoringService.getInstance();
    const config = monitoringService.getConfig();
    
    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('Failed to get monitoring config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve monitoring configuration',
      details: error.message,
    });
  }
});

// Update monitoring configuration
router.put('/monitoring/config', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const monitoringService = MonitoringService.getInstance();
    const newConfig = req.body;
    
    // Validate configuration
    const validFields = [
      'enabled', 'interval', 'retention', 'logLocation',
      'alertThresholds', 'notifications'
    ];
    
    const updates: any = {};
    for (const field of validFields) {
      if (newConfig[field] !== undefined) {
        updates[field] = newConfig[field];
      }
    }
    
    monitoringService.updateConfig(updates);
    
    res.json({
      success: true,
      data: monitoringService.getConfig(),
      message: 'Monitoring configuration updated',
    });
  } catch (error: any) {
    console.error('Failed to update monitoring config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update monitoring configuration',
      details: error.message,
    });
  }
});

// Schedule maintenance window
router.post('/maintenance', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const dbService = DatabaseService.getInstance();
    const maintenance = await dbService.scheduleMaintenanceWindow();
    
    res.json({
      success: true,
      data: maintenance,
      message: 'Maintenance window scheduled',
    });
  } catch (error: any) {
    console.error('Failed to schedule maintenance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule maintenance',
      details: error.message,
    });
  }
});

// Execute query (for debugging - use with extreme caution)
router.post('/query', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { query, params = [] } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }
    
    // Whitelist allowed query types for safety
    const allowedQueries = /^(SELECT|SHOW|EXPLAIN|DESCRIBE)\s+/i;
    if (!allowedQueries.test(query.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Only SELECT, SHOW, EXPLAIN, and DESCRIBE queries are allowed',
      });
    }
    
    const dbService = DatabaseService.getInstance();
    const prisma = dbService.getPrismaClient();
    
    const result = await prisma.$queryRawUnsafe(query, ...params);
    
    res.json({
      success: true,
      data: result,
      query: query,
    });
  } catch (error: any) {
    console.error('Query execution failed:', error);
    res.status(500).json({
      success: false,
      error: 'Query execution failed',
      details: error.message,
    });
  }
});

// Get database statistics
router.get('/stats', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const dbService = DatabaseService.getInstance();
    const prisma = dbService.getPrismaClient();
    
    // Get table statistics
    const tableStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_live_tup as row_count,
        n_dead_tup as dead_rows,
        pg_size_pretty(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename))) as size
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `;
    
    // Get index usage
    const indexStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
      LIMIT 20
    `;
    
    // Get query performance
    const queryStats = await prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        max_time,
        rows
      FROM pg_stat_statements 
      ORDER BY total_time DESC 
      LIMIT 10
    `;
    
    res.json({
      success: true,
      data: {
        tables: tableStats,
        indexes: indexStats,
        queries: queryStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Failed to get database statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve database statistics',
      details: error.message,
    });
  }
});

export default router;
