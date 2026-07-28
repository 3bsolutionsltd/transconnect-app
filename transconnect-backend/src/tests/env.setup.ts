import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const rootDir = path.resolve(__dirname, '../..');
const envTestPath = path.join(rootDir, '.env.test');
const envPath = path.join(rootDir, '.env');

if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath, override: false });
}

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

// Prefer an explicit test database URL when provided.
if (process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}