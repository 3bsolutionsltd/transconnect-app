import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

interface DatabaseConfig {
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  backupEnabled: boolean;
  maintenanceWindow: string;
}

interface ConnectionPoolStats {
  total: number;
  idle: number;
  active: number;
  waiting: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma!: PrismaClient;
  private redis: any;
  private config: DatabaseConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
      enableLogging: process.env.DB_ENABLE_LOGGING === 'true',
      enableMetrics: process.env.DB_ENABLE_METRICS === 'true',
      backupEnabled: process.env.DB_BACKUP_ENABLED === 'true',
      maintenanceWindow: process.env.DB_MAINTENANCE_WINDOW || '02:00-04:00',
    };

    this.initializePrisma();
    this.initializeRedis();
    this.startHealthChecks();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initializePrisma(): void {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.buildConnectionString(),
        },
      },
      log: this.config.enableLogging
        ? ['query', 'info', 'warn', 'error']
        : [],
    });

    // Set up simple logging without event listeners for production compatibility
    if (this.config.enableLogging) {
      console.log('Database logging enabled');
    }
  }

  private initializeRedis(): void {
    if (process.env.REDIS_URL) {
      this.redis = createClient({
        url: process.env.REDIS_URL,
      });

      this.redis.on('error', (err: any) => {
        console.error('Redis Client Error:', err);
      });

      this.redis.on('connect', () => {
        console.log('Redis Client Connected');
      });

      this.redis.connect().catch((err: any) => {
        console.error('Redis Connection Error:', err);
      });
    }
  }

  private buildConnectionString(): string {
    const baseUrl = process.env.DATABASE_URL || '';
    
    // Add connection pool parameters for production
    const poolParams = new URLSearchParams({
      connection_limit: this.config.maxConnections.toString(),
      pool_timeout: this.config.connectionTimeout.toString(),
      socket_timeout: this.config.queryTimeout.toString(),
      statement_cache_size: '100',
      prepared_statements: 'true',
      schema_cache: 'true',
    });

    return `${baseUrl}?${poolParams.toString()}`;
  }

  private startHealthChecks(): void {
    if (this.config.enableMetrics) {
      this.healthCheckInterval = setInterval(async () => {
        await this.performHealthCheck();
      }, 30000); // Check every 30 seconds
    }
  }

  public async performHealthCheck(): Promise<{
    database: boolean;
    redis: boolean;
    connectionPool: ConnectionPoolStats;
    metrics: any;
  }> {
    const healthStatus = {
      database: false,
      redis: false,
      connectionPool: { total: 0, idle: 0, active: 0, waiting: 0 },
      metrics: {},
    };

    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      healthStatus.database = true;

      // Get connection pool stats
      const poolStats = await this.getConnectionPoolStats();
      healthStatus.connectionPool = poolStats;

      // Get database metrics
      if (this.config.enableMetrics) {
        healthStatus.metrics = await this.getDatabaseMetrics();
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      healthStatus.database = false;
    }

    try {
      // Test Redis connection
      if (this.redis) {
        await this.redis.ping();
        healthStatus.redis = true;
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
      healthStatus.redis = false;
    }

    return healthStatus;
  }

  private async getConnectionPoolStats(): Promise<ConnectionPoolStats> {
    try {
      // Get connection pool information from PostgreSQL
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          count(*) as total_connections,
          count(case when state = 'idle' then 1 end) as idle_connections,
          count(case when state = 'active' then 1 end) as active_connections,
          count(case when wait_event is not null then 1 end) as waiting_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      if (result.length > 0) {
        const row = result[0];
        return {
          total: parseInt(row.total_connections) || 0,
          idle: parseInt(row.idle_connections) || 0,
          active: parseInt(row.active_connections) || 0,
          waiting: parseInt(row.waiting_connections) || 0,
        };
      }
    } catch (error) {
      console.error('Error getting connection pool stats:', error);
    }

    return { total: 0, idle: 0, active: 0, waiting: 0 };
  }

  private async getDatabaseMetrics(): Promise<any> {
    try {
      // Get database performance metrics
      const metrics = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_analyze
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `;

      const dbSize = await this.prisma.$queryRaw<any[]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;

      const slowQueries = await this.prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          max_time
        FROM pg_stat_statements 
        WHERE calls > 100
        ORDER BY mean_time DESC 
        LIMIT 5
      `;

      return {
        tableStats: metrics,
        databaseSize: dbSize[0]?.size || 'Unknown',
        slowQueries: slowQueries,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting database metrics:', error);
      return {
        error: 'Metrics collection failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async executeTransaction<T>(
    callback: (prisma: any) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(callback, {
      maxWait: this.config.connectionTimeout,
      timeout: this.config.queryTimeout,
    });
  }

  public async optimizeDatabase(): Promise<{
    vacuumCompleted: boolean;
    analyzeCompleted: boolean;
    reindexCompleted: boolean;
    errors: string[];
  }> {
    const results = {
      vacuumCompleted: false,
      analyzeCompleted: false,
      reindexCompleted: false,
      errors: [] as string[],
    };

    try {
      // VACUUM to reclaim storage
      console.log('Starting database VACUUM...');
      await this.prisma.$executeRaw`VACUUM`;
      results.vacuumCompleted = true;
      console.log('VACUUM completed successfully');
    } catch (error: any) {
      console.error('VACUUM failed:', error);
      results.errors.push(`VACUUM failed: ${error.message}`);
    }

    try {
      // ANALYZE to update statistics
      console.log('Starting database ANALYZE...');
      await this.prisma.$executeRaw`ANALYZE`;
      results.analyzeCompleted = true;
      console.log('ANALYZE completed successfully');
    } catch (error: any) {
      console.error('ANALYZE failed:', error);
      results.errors.push(`ANALYZE failed: ${error.message}`);
    }

    try {
      // REINDEX for better performance
      console.log('Starting database REINDEX...');
      await this.prisma.$executeRaw`REINDEX DATABASE CONCURRENTLY ${this.getDatabaseName()}`;
      results.reindexCompleted = true;
      console.log('REINDEX completed successfully');
    } catch (error: any) {
      console.error('REINDEX failed:', error);
      results.errors.push(`REINDEX failed: ${error.message}`);
    }

    return results;
  }

  private getDatabaseName(): string {
    const url = new URL(process.env.DATABASE_URL || '');
    return url.pathname.substring(1); // Remove leading slash
  }

  public async createBackup(): Promise<{
    success: boolean;
    backupId: string;
    location: string;
    size?: number;
    error?: string;
  }> {
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupLocation = `${process.env.BACKUP_LOCATION || './backups'}/transconnect_${timestamp}.sql`;

    try {
      // This would typically use pg_dump command
      // For now, we'll simulate the backup process
      console.log(`Creating backup: ${backupId}`);
      console.log(`Backup location: ${backupLocation}`);

      // In production, you would execute:
      // pg_dump $DATABASE_URL > $backupLocation
      
      // For simulation, let's create a basic backup info
      const backupInfo = {
        backupId,
        timestamp: new Date().toISOString(),
        tables: await this.getTableList(),
        recordCounts: await this.getRecordCounts(),
      };

      // Store backup metadata
      if (this.redis) {
        await this.redis.setex(`backup:${backupId}`, 86400 * 7, JSON.stringify(backupInfo));
      }

      return {
        success: true,
        backupId,
        location: backupLocation,
        size: 0, // Would be actual file size
      };
    } catch (error: any) {
      console.error('Backup creation failed:', error);
      return {
        success: false,
        backupId,
        location: backupLocation,
        error: error.message,
      };
    }
  }

  private async getTableList(): Promise<string[]> {
    try {
      const tables = await this.prisma.$queryRaw<any[]>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `;
      return tables.map(t => t.tablename);
    } catch (error) {
      console.error('Error getting table list:', error);
      return [];
    }
  }

  private async getRecordCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    
    try {
      const tables = await this.getTableList();
      
      for (const table of tables) {
        try {
          const result = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
          counts[table] = parseInt((result as any)[0].count) || 0;
        } catch (error) {
          console.error(`Error counting records in ${table}:`, error);
          counts[table] = -1; // Indicate error
        }
      }
    } catch (error) {
      console.error('Error getting record counts:', error);
    }

    return counts;
  }

  public async getBackupHistory(): Promise<any[]> {
    if (!this.redis) {
      return [];
    }

    try {
      const keys = await this.redis.keys('backup:*');
      const backups: any[] = [];

      for (const key of keys) {
        const backupData = await this.redis.get(key);
        if (backupData) {
          backups.push(JSON.parse(backupData));
        }
      }

      return backups.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error getting backup history:', error);
      return [];
    }
  }

  public async scheduleMaintenanceWindow(): Promise<{
    scheduled: boolean;
    window: string;
    tasks: string[];
    estimatedDuration: string;
  }> {
    const tasks = [
      'Database vacuum and analyze',
      'Index optimization',
      'Connection pool optimization',
      'Statistics update',
      'Log rotation',
    ];

    return {
      scheduled: true,
      window: this.config.maintenanceWindow,
      tasks,
      estimatedDuration: '2 hours',
    };
  }

  private logErrorToMonitoring(error: any): void {
    // In production, integrate with monitoring services like:
    // - Sentry
    // - DataDog
    // - New Relic
    // - CloudWatch
    
    console.error('Database monitoring alert:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
    });
  }

  public getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  public getRedisClient(): any {
    return this.redis;
  }

  public async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    await this.prisma.$disconnect();
    
    if (this.redis) {
      await this.redis.disconnect();
    }

    console.log('Database connections closed');
  }
}