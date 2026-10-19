import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Look for .env files in order of priority:
// 1. Root directory .env
// 2. apps/api/.env
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/api/.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../.env'),
];

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
