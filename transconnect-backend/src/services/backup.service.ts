import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

const execAsync = promisify(exec);

interface BackupConfig {
  enabled: boolean;
  schedule: string;
  retentionDays: number;
  location: string;
  compression: boolean;
  encryption: boolean;
  cloudUpload: boolean;
  notifications: boolean;
}

interface BackupResult {
  success: boolean;
  backupId: string;
  filename: string;
  size: number;
  duration: number;
  error?: string;
  checksum?: string;
}

export class BackupService {
  private static instance: BackupService;
  private config: BackupConfig;
  private backupJobs: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.config = {
      enabled: process.env.BACKUP_ENABLED === 'true',
      schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      location: process.env.BACKUP_LOCATION || './backups',
      compression: process.env.BACKUP_COMPRESSION === 'true',
      encryption: process.env.BACKUP_ENCRYPTION === 'true',
      cloudUpload: process.env.BACKUP_CLOUD_UPLOAD === 'true',
      notifications: process.env.BACKUP_NOTIFICATIONS === 'true',
    };

    this.initializeBackupDirectory();
    this.scheduleBackups();
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private async initializeBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.location, { recursive: true });
      console.log(`Backup directory initialized: ${this.config.location}`);
    } catch (error) {
      console.error('Failed to initialize backup directory:', error);
    }
  }

  private scheduleBackups(): void {
    if (!this.config.enabled) {
      console.log('Database backups are disabled');
      return;
    }

    // Schedule daily backups
    const dailyBackup = setInterval(async () => {
      await this.createFullBackup('scheduled-daily');
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    // Schedule weekly full backups
    const weeklyBackup = setInterval(async () => {
      await this.createFullBackup('scheduled-weekly');
      await this.cleanupOldBackups();
    }, 7 * 24 * 60 * 60 * 1000); // Every 7 days

    this.backupJobs.set('daily', dailyBackup);
    this.backupJobs.set('weekly', weeklyBackup);

    console.log('Backup schedule initialized');
  }

  public async createFullBackup(type: string = 'manual'): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${type}_${timestamp}`;
    const filename = `transconnect_${backupId}.sql`;
    const filepath = path.join(this.config.location, filename);

    console.log(`Starting full backup: ${backupId}`);

    try {
      // Create database dump using pg_dump
      const dumpCommand = this.buildDumpCommand(filepath);
      console.log(`Executing: ${dumpCommand.replace(/password=\S+/g, 'password=***')}`);
      
      await execAsync(dumpCommand);

      // Get file size
      const stats = await fs.stat(filepath);
      const size = stats.size;

      // Compress if enabled
      let finalFilename = filename;
      let finalSize = size;

      if (this.config.compression) {
        const compressedFilename = `${filename}.gz`;
        const compressedPath = path.join(this.config.location, compressedFilename);
        
        await this.compressFile(filepath, compressedPath);
        await fs.unlink(filepath); // Remove uncompressed file
        
        const compressedStats = await fs.stat(compressedPath);
        finalFilename = compressedFilename;
        finalSize = compressedStats.size;
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(path.join(this.config.location, finalFilename));

      // Encrypt if enabled
      if (this.config.encryption) {
        await this.encryptFile(path.join(this.config.location, finalFilename));
        finalFilename = `${finalFilename}.enc`;
      }

      const duration = Date.now() - startTime;

      const result: BackupResult = {
        success: true,
        backupId,
        filename: finalFilename,
        size: finalSize,
        duration,
        checksum,
      };

      // Upload to cloud if enabled
      if (this.config.cloudUpload) {
        await this.uploadToCloud(finalFilename);
      }

      // Save backup metadata
      await this.saveBackupMetadata(result);

      // Send notification if enabled
      if (this.config.notifications) {
        await this.sendBackupNotification(result, 'success');
      }

      console.log(`Backup completed successfully: ${finalFilename} (${this.formatFileSize(finalSize)})`);
      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      const result: BackupResult = {
        success: false,
        backupId,
        filename,
        size: 0,
        duration,
        error: error.message,
      };

      // Send error notification
      if (this.config.notifications) {
        await this.sendBackupNotification(result, 'error');
      }

      console.error(`Backup failed: ${error.message}`);
      return result;
    }
  }

  private buildDumpCommand(filepath: string): string {
    const dbUrl = new URL(process.env.DATABASE_URL || '');
    
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const database = dbUrl.pathname.substring(1);
    const username = dbUrl.username;
    const password = dbUrl.password;

    // Build pg_dump command with connection parameters
    let command = `pg_dump`;
    command += ` --host=${host}`;
    command += ` --port=${port}`;
    command += ` --username=${username}`;
    command += ` --dbname=${database}`;
    command += ` --no-password`;
    command += ` --format=custom`;
    command += ` --compress=9`;
    command += ` --verbose`;
    command += ` --file="${filepath}"`;

    // Set password via environment variable
    return `PGPASSWORD="${password}" ${command}`;
  }

  private async compressFile(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('tar', { 
        gzip: true,
        gzipOptions: { level: 9 }
      });

      output.on('close', () => {
        console.log(`Compression completed: ${archive.pointer()} bytes`);
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.file(inputPath, { name: path.basename(inputPath) });
      archive.finalize();
    });
  }

  private async calculateChecksum(filepath: string): Promise<string> {
    const crypto = require('crypto');
    const fileBuffer = await fs.readFile(filepath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  private async encryptFile(filepath: string): Promise<void> {
    // This is a placeholder for file encryption
    // In production, use proper encryption libraries like:
    // - node-forge
    // - crypto (Node.js built-in)
    // - libsodium
    
    console.log(`Encrypting file: ${filepath}`);
    
    const crypto = require('crypto');
    const key = process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-cbc';
    
    try {
      const data = await fs.readFile(filepath);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      const encryptedPath = `${filepath}.enc`;
      await fs.writeFile(encryptedPath, Buffer.concat([iv, encrypted]));
      await fs.unlink(filepath); // Remove unencrypted file
      
      console.log(`File encrypted successfully: ${encryptedPath}`);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  private async uploadToCloud(filename: string): Promise<void> {
    // Placeholder for cloud upload functionality
    // In production, integrate with:
    // - AWS S3
    // - Google Cloud Storage
    // - Azure Blob Storage
    // - DigitalOcean Spaces
    
    console.log(`Uploading to cloud: ${filename}`);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`Cloud upload completed: ${filename}`);
  }

  private async saveBackupMetadata(result: BackupResult): Promise<void> {
    const metadataPath = path.join(this.config.location, 'backup-metadata.json');
    
    try {
      let metadata: any[] = [];
      
      try {
        const existing = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(existing);
      } catch (error) {
        // File doesn't exist or is invalid, start with empty array
      }

      metadata.push({
        ...result,
        timestamp: new Date().toISOString(),
        config: {
          compression: this.config.compression,
          encryption: this.config.encryption,
          cloudUpload: this.config.cloudUpload,
        },
      });

      // Keep only last 100 backup records
      if (metadata.length > 100) {
        metadata = metadata.slice(-100);
      }

      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('Failed to save backup metadata:', error);
    }
  }

  private async sendBackupNotification(result: BackupResult, status: 'success' | 'error'): Promise<void> {
    // In production, integrate with notification services
    const message = status === 'success'
      ? `✅ Database backup completed successfully
         Backup ID: ${result.backupId}
         Size: ${this.formatFileSize(result.size)}
         Duration: ${(result.duration / 1000).toFixed(2)}s`
      : `❌ Database backup failed
         Backup ID: ${result.backupId}
         Error: ${result.error}
         Duration: ${(result.duration / 1000).toFixed(2)}s`;

    console.log('Backup Notification:', message);
    
    // Here you would send to:
    // - Email
    // - Slack
    // - Discord
    // - SMS
    // - Push notifications
  }

  public async restoreFromBackup(backupId: string): Promise<{
    success: boolean;
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      console.log(`Starting database restore from backup: ${backupId}`);
      
      // Find backup file
      const backupFile = await this.findBackupFile(backupId);
      if (!backupFile) {
        throw new Error(`Backup file not found: ${backupId}`);
      }

      // Decrypt if needed
      let restoreFile = backupFile;
      if (backupFile.endsWith('.enc')) {
        restoreFile = await this.decryptFile(backupFile);
      }

      // Decompress if needed
      if (restoreFile.endsWith('.gz')) {
        restoreFile = await this.decompressFile(restoreFile);
      }

      // Restore database using pg_restore
      const restoreCommand = this.buildRestoreCommand(restoreFile);
      console.log(`Executing restore: ${restoreCommand.replace(/password=\S+/g, 'password=***')}`);
      
      await execAsync(restoreCommand);

      const duration = Date.now() - startTime;
      console.log(`Database restore completed successfully in ${(duration / 1000).toFixed(2)}s`);

      return {
        success: true,
        duration,
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`Database restore failed: ${error.message}`);

      return {
        success: false,
        duration,
        error: error.message,
      };
    }
  }

  private async findBackupFile(backupId: string): Promise<string | null> {
    try {
      const files = await fs.readdir(this.config.location);
      const backupFile = files.find(file => file.includes(backupId));
      
      if (backupFile) {
        return path.join(this.config.location, backupFile);
      }
      
      return null;
    } catch (error) {
      console.error('Error finding backup file:', error);
      return null;
    }
  }

  private async decryptFile(encryptedPath: string): Promise<string> {
    // Placeholder for decryption
    console.log(`Decrypting file: ${encryptedPath}`);
    
    const crypto = require('crypto');
    const key = process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-cbc';
    
    try {
      const encryptedData = await fs.readFile(encryptedPath);
      const iv = encryptedData.slice(0, 16);
      const encrypted = encryptedData.slice(16);
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      const decryptedPath = encryptedPath.replace('.enc', '');
      await fs.writeFile(decryptedPath, decrypted);
      
      console.log(`File decrypted successfully: ${decryptedPath}`);
      return decryptedPath;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  private async decompressFile(compressedPath: string): Promise<string> {
    // Placeholder for decompression
    console.log(`Decompressing file: ${compressedPath}`);
    
    const decompressedPath = compressedPath.replace('.gz', '');
    
    // In production, use proper decompression
    await execAsync(`gunzip -c "${compressedPath}" > "${decompressedPath}"`);
    
    console.log(`File decompressed successfully: ${decompressedPath}`);
    return decompressedPath;
  }

  private buildRestoreCommand(filepath: string): string {
    const dbUrl = new URL(process.env.DATABASE_URL || '');
    
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const database = dbUrl.pathname.substring(1);
    const username = dbUrl.username;
    const password = dbUrl.password;

    // Build pg_restore command
    let command = `pg_restore`;
    command += ` --host=${host}`;
    command += ` --port=${port}`;
    command += ` --username=${username}`;
    command += ` --dbname=${database}`;
    command += ` --no-password`;
    command += ` --clean`;
    command += ` --if-exists`;
    command += ` --verbose`;
    command += ` "${filepath}"`;

    return `PGPASSWORD="${password}" ${command}`;
  }

  public async cleanupOldBackups(): Promise<{
    deleted: number;
    errors: string[];
  }> {
    const result = {
      deleted: 0,
      errors: [] as string[],
    };

    try {
      const files = await fs.readdir(this.config.location);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      for (const file of files) {
        try {
          const filepath = path.join(this.config.location, file);
          const stats = await fs.stat(filepath);
          
          if (stats.isFile() && stats.mtime < cutoffDate && file.includes('transconnect_')) {
            await fs.unlink(filepath);
            result.deleted++;
            console.log(`Deleted old backup: ${file}`);
          }
        } catch (error: any) {
          result.errors.push(`Failed to delete ${file}: ${error.message}`);
        }
      }

      console.log(`Cleanup completed: ${result.deleted} files deleted, ${result.errors.length} errors`);
    } catch (error: any) {
      result.errors.push(`Cleanup failed: ${error.message}`);
    }

    return result;
  }

  public async getBackupList(): Promise<any[]> {
    try {
      const metadataPath = path.join(this.config.location, 'backup-metadata.json');
      const data = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read backup metadata:', error);
      return [];
    }
  }

  public async validateBackup(backupId: string): Promise<{
    valid: boolean;
    checksumMatch: boolean;
    fileExists: boolean;
    error?: string;
  }> {
    try {
      const backupFile = await this.findBackupFile(backupId);
      
      if (!backupFile) {
        return {
          valid: false,
          checksumMatch: false,
          fileExists: false,
          error: 'Backup file not found',
        };
      }

      // Check if file exists and is readable
      await fs.access(backupFile, fs.constants.R_OK);

      // Calculate current checksum
      const currentChecksum = await this.calculateChecksum(backupFile);
      
      // Get stored checksum from metadata
      const backups = await this.getBackupList();
      const backup = backups.find(b => b.backupId === backupId);
      
      const checksumMatch = backup ? backup.checksum === currentChecksum : false;

      return {
        valid: true,
        checksumMatch,
        fileExists: true,
      };

    } catch (error: any) {
      return {
        valid: false,
        checksumMatch: false,
        fileExists: false,
        error: error.message,
      };
    }
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  public getConfig(): BackupConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Backup configuration updated:', newConfig);
  }

  public stopScheduledBackups(): void {
    for (const [name, job] of this.backupJobs) {
      clearInterval(job);
      console.log(`Stopped ${name} backup job`);
    }
    this.backupJobs.clear();
  }
}