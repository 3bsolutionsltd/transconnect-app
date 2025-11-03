import { DatabaseService } from './database.service';
import { createWriteStream, WriteStream } from 'fs';
import * as path from 'path';
import * as fs from 'fs/promises';

interface MetricsConfig {
  enabled: boolean;
  interval: number;
  retention: number;
  logLocation: string;
  alertThresholds: AlertThresholds;
  notifications: NotificationConfig;
}

interface AlertThresholds {
  connectionPoolUsage: number;
  queryDuration: number;
  errorRate: number;
  diskUsage: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface NotificationConfig {
  email: boolean;
  slack: boolean;
  webhook: string;
  escalation: boolean;
}

interface DatabaseMetrics {
  timestamp: string;
  connections: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
    usage: number; // percentage
  };
  queries: {
    total: number;
    slow: number;
    errors: number;
    avgDuration: number;
    maxDuration: number;
  };
  database: {
    size: string;
    growth: number;
    tables: number;
    indexes: number;
  };
  performance: {
    tps: number; // transactions per second
    qps: number; // queries per second
    cacheHitRatio: number;
    bufferHitRatio: number;
  };
  system: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private config: MetricsConfig;
  private dbService: DatabaseService;
  private metricsInterval: NodeJS.Timeout | null = null;
  private logStream: WriteStream | null = null;
  private currentAlerts: Map<string, Alert> = new Map();
  private metricsHistory: DatabaseMetrics[] = [];

  private constructor() {
    this.config = {
      enabled: process.env.MONITORING_ENABLED === 'true',
      interval: parseInt(process.env.MONITORING_INTERVAL || '30000'), // 30 seconds
      retention: parseInt(process.env.MONITORING_RETENTION || '7'), // 7 days
      logLocation: process.env.MONITORING_LOG_LOCATION || './logs/monitoring',
      alertThresholds: {
        connectionPoolUsage: parseInt(process.env.ALERT_CONNECTION_POOL_USAGE || '80'),
        queryDuration: parseInt(process.env.ALERT_QUERY_DURATION || '5000'),
        errorRate: parseInt(process.env.ALERT_ERROR_RATE || '5'),
        diskUsage: parseInt(process.env.ALERT_DISK_USAGE || '85'),
        memoryUsage: parseInt(process.env.ALERT_MEMORY_USAGE || '85'),
        cpuUsage: parseInt(process.env.ALERT_CPU_USAGE || '80'),
      },
      notifications: {
        email: process.env.ALERT_EMAIL_ENABLED === 'true',
        slack: process.env.ALERT_SLACK_ENABLED === 'true',
        webhook: process.env.ALERT_WEBHOOK_URL || '',
        escalation: process.env.ALERT_ESCALATION_ENABLED === 'true',
      },
    };

    this.dbService = DatabaseService.getInstance();
    this.initializeMonitoring();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private async initializeMonitoring(): Promise<void> {
    if (!this.config.enabled) {
      console.log('Database monitoring is disabled');
      return;
    }

    try {
      // Create log directory
      await fs.mkdir(this.config.logLocation, { recursive: true });
      
      // Initialize log stream
      const logFile = path.join(this.config.logLocation, `metrics-${new Date().toISOString().split('T')[0]}.log`);
      this.logStream = createWriteStream(logFile, { flags: 'a' });

      // Start metrics collection
      this.startMetricsCollection();
      
      // Start log rotation
      this.scheduleLogRotation();

      console.log('Database monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        await this.processMetrics(metrics);
      } catch (error) {
        console.error('Metrics collection error:', error);
      }
    }, this.config.interval);

    console.log(`Metrics collection started (interval: ${this.config.interval}ms)`);
  }

  private async collectMetrics(): Promise<DatabaseMetrics> {
    const timestamp = new Date().toISOString();
    const prisma = this.dbService.getPrismaClient();

    // Collect connection metrics
    const healthStatus = await this.dbService.performHealthCheck();
    const connectionStats = healthStatus.connectionPool;
    const connectionUsage = connectionStats.total > 0 
      ? (connectionStats.active / connectionStats.total) * 100 
      : 0;

    // Collect query metrics
    const queryMetrics = await this.getQueryMetrics();

    // Collect database size and growth
    const databaseMetrics = await this.getDatabaseMetrics();

    // Collect performance metrics
    const performanceMetrics = await this.getPerformanceMetrics();

    // Collect system metrics
    const systemMetrics = await this.getSystemMetrics();

    const metrics: DatabaseMetrics = {
      timestamp,
      connections: {
        total: connectionStats.total,
        active: connectionStats.active,
        idle: connectionStats.idle,
        waiting: connectionStats.waiting,
        usage: connectionUsage,
      },
      queries: queryMetrics,
      database: databaseMetrics,
      performance: performanceMetrics,
      system: systemMetrics,
    };

    return metrics;
  }

  private async getQueryMetrics(): Promise<DatabaseMetrics['queries']> {
    try {
      const prisma = this.dbService.getPrismaClient();
      
      // Get query statistics from pg_stat_statements
      const queryStats = await prisma.$queryRaw<any[]>`
        SELECT 
          count(*) as total_queries,
          sum(calls) as total_calls,
          avg(mean_time) as avg_duration,
          max(max_time) as max_duration,
          sum(case when mean_time > 1000 then calls else 0 end) as slow_queries
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
      `;

      if (queryStats.length > 0) {
        const stats = queryStats[0];
        return {
          total: parseInt(stats.total_calls) || 0,
          slow: parseInt(stats.slow_queries) || 0,
          errors: 0, // Would need error tracking
          avgDuration: parseFloat(stats.avg_duration) || 0,
          maxDuration: parseFloat(stats.max_duration) || 0,
        };
      }
    } catch (error) {
      console.error('Error collecting query metrics:', error);
    }

    return {
      total: 0,
      slow: 0,
      errors: 0,
      avgDuration: 0,
      maxDuration: 0,
    };
  }

  private async getDatabaseMetrics(): Promise<DatabaseMetrics['database']> {
    try {
      const prisma = this.dbService.getPrismaClient();

      // Get database size
      const sizeResult = await prisma.$queryRaw<any[]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as size_bytes
      `;

      // Get table count
      const tableResult = await prisma.$queryRaw<any[]>`
        SELECT count(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;

      // Get index count
      const indexResult = await prisma.$queryRaw<any[]>`
        SELECT count(*) as index_count 
        FROM pg_indexes 
        WHERE schemaname = 'public'
      `;

      return {
        size: sizeResult[0]?.size || '0 bytes',
        growth: 0, // Would calculate from historical data
        tables: parseInt(tableResult[0]?.table_count) || 0,
        indexes: parseInt(indexResult[0]?.index_count) || 0,
      };
    } catch (error) {
      console.error('Error collecting database metrics:', error);
      return {
        size: '0 bytes',
        growth: 0,
        tables: 0,
        indexes: 0,
      };
    }
  }

  private async getPerformanceMetrics(): Promise<DatabaseMetrics['performance']> {
    try {
      const prisma = this.dbService.getPrismaClient();

      // Get transaction rate
      const transactionStats = await prisma.$queryRaw<any[]>`
        SELECT 
          xact_commit + xact_rollback as total_transactions,
          tup_fetched,
          tup_returned
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;

      // Get buffer hit ratio
      const bufferStats = await prisma.$queryRaw<any[]>`
        SELECT 
          sum(blks_hit) as buffer_hits,
          sum(blks_read) as disk_reads
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;

      let bufferHitRatio = 0;
      if (bufferStats.length > 0) {
        const hits = parseInt(bufferStats[0].buffer_hits) || 0;
        const reads = parseInt(bufferStats[0].disk_reads) || 0;
        const total = hits + reads;
        bufferHitRatio = total > 0 ? (hits / total) * 100 : 0;
      }

      return {
        tps: 0, // Would calculate from time-based data
        qps: 0, // Would calculate from time-based data
        cacheHitRatio: 0, // Would need cache statistics
        bufferHitRatio,
      };
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
      return {
        tps: 0,
        qps: 0,
        cacheHitRatio: 0,
        bufferHitRatio: 0,
      };
    }
  }

  private async getSystemMetrics(): Promise<DatabaseMetrics['system']> {
    try {
      // Get system metrics from OS
      const os = require('os');
      
      const cpuUsage = await this.getCpuUsage();
      const memoryUsage = (1 - os.freemem() / os.totalmem()) * 100;
      const diskUsage = await this.getDiskUsage();

      return {
        cpu: cpuUsage,
        memory: memoryUsage,
        disk: diskUsage,
        network: 0, // Would need network monitoring
      };
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      return {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
      };
    }
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const os = require('os');
      const cpus = os.cpus();
      
      let totalIdle = 0;
      let totalTick = 0;
      
      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      }
      
      setTimeout(() => {
        const cpus2 = os.cpus();
        let totalIdle2 = 0;
        let totalTick2 = 0;
        
        for (const cpu of cpus2) {
          for (const type in cpu.times) {
            totalTick2 += cpu.times[type];
          }
          totalIdle2 += cpu.times.idle;
        }
        
        const idle = totalIdle2 - totalIdle;
        const total = totalTick2 - totalTick;
        const usage = 100 - ~~(100 * idle / total);
        
        resolve(usage);
      }, 1000);
    });
  }

  private async getDiskUsage(): Promise<number> {
    try {
      const { execSync } = require('child_process');
      
      // Get disk usage for the current directory
      const output = execSync('df -h .', { encoding: 'utf-8' });
      const lines = output.trim().split('\n');
      
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        const usagePercent = parts[4].replace('%', '');
        return parseInt(usagePercent) || 0;
      }
    } catch (error) {
      console.error('Error getting disk usage:', error);
    }
    
    return 0;
  }

  private async processMetrics(metrics: DatabaseMetrics): Promise<void> {
    // Store metrics in history
    this.metricsHistory.push(metrics);
    
    // Keep only recent metrics (based on retention policy)
    const retentionMs = this.config.retention * 24 * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - retentionMs);
    this.metricsHistory = this.metricsHistory.filter(
      m => new Date(m.timestamp) > cutoffTime
    );

    // Log metrics
    if (this.logStream) {
      this.logStream.write(`${JSON.stringify(metrics)}\n`);
    }

    // Check for alerts
    await this.checkAlerts(metrics);

    // Store metrics in database (optional)
    await this.storeMetrics(metrics);
  }

  private async checkAlerts(metrics: DatabaseMetrics): Promise<void> {
    const alerts: Alert[] = [];

    // Check connection pool usage
    if (metrics.connections.usage > this.config.alertThresholds.connectionPoolUsage) {
      alerts.push({
        id: 'connection-pool-high',
        type: 'warning',
        metric: 'connection_pool_usage',
        value: metrics.connections.usage,
        threshold: this.config.alertThresholds.connectionPoolUsage,
        message: `High connection pool usage: ${metrics.connections.usage.toFixed(1)}%`,
        timestamp: metrics.timestamp,
        resolved: false,
      });
    }

    // Check query duration
    if (metrics.queries.maxDuration > this.config.alertThresholds.queryDuration) {
      alerts.push({
        id: 'slow-query',
        type: 'warning',
        metric: 'query_duration',
        value: metrics.queries.maxDuration,
        threshold: this.config.alertThresholds.queryDuration,
        message: `Slow query detected: ${metrics.queries.maxDuration.toFixed(0)}ms`,
        timestamp: metrics.timestamp,
        resolved: false,
      });
    }

    // Check system resources
    if (metrics.system.cpu > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        id: 'high-cpu',
        type: 'warning',
        metric: 'cpu_usage',
        value: metrics.system.cpu,
        threshold: this.config.alertThresholds.cpuUsage,
        message: `High CPU usage: ${metrics.system.cpu.toFixed(1)}%`,
        timestamp: metrics.timestamp,
        resolved: false,
      });
    }

    if (metrics.system.memory > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        id: 'high-memory',
        type: 'warning',
        metric: 'memory_usage',
        value: metrics.system.memory,
        threshold: this.config.alertThresholds.memoryUsage,
        message: `High memory usage: ${metrics.system.memory.toFixed(1)}%`,
        timestamp: metrics.timestamp,
        resolved: false,
      });
    }

    if (metrics.system.disk > this.config.alertThresholds.diskUsage) {
      alerts.push({
        id: 'high-disk',
        type: 'critical',
        metric: 'disk_usage',
        value: metrics.system.disk,
        threshold: this.config.alertThresholds.diskUsage,
        message: `High disk usage: ${metrics.system.disk.toFixed(1)}%`,
        timestamp: metrics.timestamp,
        resolved: false,
      });
    }

    // Process new alerts
    for (const alert of alerts) {
      if (!this.currentAlerts.has(alert.id)) {
        this.currentAlerts.set(alert.id, alert);
        await this.sendAlert(alert);
      }
    }

    // Check for resolved alerts
    for (const [alertId, existingAlert] of this.currentAlerts) {
      if (!alerts.find(a => a.id === alertId) && !existingAlert.resolved) {
        existingAlert.resolved = true;
        existingAlert.resolvedAt = metrics.timestamp;
        await this.sendAlert(existingAlert);
      }
    }
  }

  private async sendAlert(alert: Alert): Promise<void> {
    const message = alert.resolved
      ? `✅ RESOLVED: ${alert.message}`
      : `🚨 ALERT: ${alert.message}`;

    console.log(`Database Alert [${alert.type.toUpperCase()}]: ${message}`);

    // Send to configured notification channels
    if (this.config.notifications.email) {
      await this.sendEmailAlert(alert);
    }

    if (this.config.notifications.slack) {
      await this.sendSlackAlert(alert);
    }

    if (this.config.notifications.webhook) {
      await this.sendWebhookAlert(alert);
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Placeholder for email integration
    console.log(`Email alert: ${alert.message}`);
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    // Placeholder for Slack integration
    console.log(`Slack alert: ${alert.message}`);
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    try {
      const fetch = require('node-fetch');
      
      const payload = {
        alert_id: alert.id,
        type: alert.type,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        message: alert.message,
        timestamp: alert.timestamp,
        resolved: alert.resolved,
        resolved_at: alert.resolvedAt,
      };

      await fetch(this.config.notifications.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log(`Webhook alert sent: ${alert.id}`);
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  private async storeMetrics(metrics: DatabaseMetrics): Promise<void> {
    try {
      // Store metrics in a separate metrics table or external service
      // This is optional - you might want to use external monitoring services
      // like Prometheus, InfluxDB, or CloudWatch
      
      const redis = this.dbService.getRedisClient();
      if (redis) {
        await redis.setex(
          `metrics:${Date.now()}`,
          86400, // 1 day TTL
          JSON.stringify(metrics)
        );
      }
    } catch (error) {
      console.error('Failed to store metrics:', error);
    }
  }

  private scheduleLogRotation(): void {
    // Rotate logs daily at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.rotateLog();
      
      // Schedule daily rotation
      setInterval(() => {
        this.rotateLog();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  private async rotateLog(): Promise<void> {
    try {
      if (this.logStream) {
        this.logStream.end();
      }

      // Create new log file
      const logFile = path.join(this.config.logLocation, `metrics-${new Date().toISOString().split('T')[0]}.log`);
      this.logStream = createWriteStream(logFile, { flags: 'a' });

      console.log('Log rotated successfully');
    } catch (error) {
      console.error('Log rotation failed:', error);
    }
  }

  public getMetricsHistory(hours: number = 24): DatabaseMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(
      m => new Date(m.timestamp) > cutoffTime
    );
  }

  public getCurrentAlerts(): Alert[] {
    return Array.from(this.currentAlerts.values()).filter(a => !a.resolved);
  }

  public getAlertHistory(): Alert[] {
    return Array.from(this.currentAlerts.values());
  }

  public async generateReport(hours: number = 24): Promise<{
    summary: any;
    metrics: DatabaseMetrics[];
    alerts: Alert[];
    recommendations: string[];
  }> {
    const metrics = this.getMetricsHistory(hours);
    const alerts = this.getAlertHistory();

    if (metrics.length === 0) {
      return {
        summary: {},
        metrics: [],
        alerts: [],
        recommendations: ['No metrics data available'],
      };
    }

    // Calculate summary statistics
    const avgConnections = metrics.reduce((sum, m) => sum + m.connections.usage, 0) / metrics.length;
    const avgQueryDuration = metrics.reduce((sum, m) => sum + m.queries.avgDuration, 0) / metrics.length;
    const maxQueryDuration = Math.max(...metrics.map(m => m.queries.maxDuration));
    const avgCpu = metrics.reduce((sum, m) => sum + m.system.cpu, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.system.memory, 0) / metrics.length;

    const summary = {
      period: `${hours} hours`,
      avgConnectionUsage: avgConnections.toFixed(1),
      avgQueryDuration: avgQueryDuration.toFixed(2),
      maxQueryDuration: maxQueryDuration.toFixed(2),
      avgCpuUsage: avgCpu.toFixed(1),
      avgMemoryUsage: avgMemory.toFixed(1),
      totalAlerts: alerts.length,
      unresolvedAlerts: alerts.filter(a => !a.resolved).length,
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, alerts);

    return {
      summary,
      metrics,
      alerts,
      recommendations,
    };
  }

  private generateRecommendations(metrics: DatabaseMetrics[], alerts: Alert[]): string[] {
    const recommendations: string[] = [];

    // Analyze connection usage
    const avgConnections = metrics.reduce((sum, m) => sum + m.connections.usage, 0) / metrics.length;
    if (avgConnections > 70) {
      recommendations.push('Consider increasing the connection pool size or optimizing connection usage');
    }

    // Analyze query performance
    const slowQueries = metrics.filter(m => m.queries.maxDuration > 1000).length;
    if (slowQueries > metrics.length * 0.1) {
      recommendations.push('Frequent slow queries detected - consider query optimization and indexing');
    }

    // Analyze system resources
    const avgCpu = metrics.reduce((sum, m) => sum + m.system.cpu, 0) / metrics.length;
    if (avgCpu > 60) {
      recommendations.push('High CPU usage detected - consider scaling up server resources');
    }

    const avgMemory = metrics.reduce((sum, m) => sum + m.system.memory, 0) / metrics.length;
    if (avgMemory > 70) {
      recommendations.push('High memory usage detected - consider optimizing queries or increasing RAM');
    }

    // Analyze buffer hit ratio
    const avgBufferHit = metrics.reduce((sum, m) => sum + m.performance.bufferHitRatio, 0) / metrics.length;
    if (avgBufferHit < 95) {
      recommendations.push('Low buffer hit ratio - consider increasing shared_buffers configuration');
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.resolved);
    if (criticalAlerts.length > 0) {
      recommendations.push('Critical alerts detected - immediate attention required');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is performing well - no recommendations at this time');
    }

    return recommendations;
  }

  public updateConfig(newConfig: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Monitoring configuration updated:', newConfig);
  }

  public getConfig(): MetricsConfig {
    return { ...this.config };
  }

  public async stop(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }

    console.log('Database monitoring stopped');
  }
}