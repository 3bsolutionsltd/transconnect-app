const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Simple backup script for development environments
async function createBackup() {
  try {
    console.log('📦 Creating database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = './backups';
    const backupFile = `transconnect_backup_${timestamp}.sql`;
    const backupPath = path.join(backupDir, backupFile);

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    console.log('🔄 Running pg_dump...');
    
    // Execute pg_dump
    const command = `pg_dump "${databaseUrl}" > "${backupPath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup failed:', error);
        return;
      }

      if (stderr) {
        console.error('⚠️  Backup warnings:', stderr);
      }

      // Check if backup file was created and has content
      if (fs.existsSync(backupPath)) {
        const stats = fs.statSync(backupPath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

        if (fileSizeInBytes > 0) {
          console.log(`✅ Backup created successfully: ${backupFile}`);
          console.log(`📊 Backup size: ${fileSizeInMB} MB`);
          console.log(`📁 Backup location: ${backupPath}`);
        } else {
          console.error('❌ Backup file is empty');
        }
      } else {
        console.error('❌ Backup file was not created');
      }
    });

  } catch (error) {
    console.error('❌ Backup process failed:', error);
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

createBackup();