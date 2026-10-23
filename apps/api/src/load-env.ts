import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Root directory .env is the single source of truth for all monorepo applications
const rootEnvCandidates = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of rootEnvCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    break;
  }
}
