import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file in backend directory
const result = config({ path: join(__dirname, '..', '.env') });
if (result.error) {
  console.warn('Failed to load .env file:', result.error);
}

// Also try to load from parent directory's .env.local (for shared configs)
const parentResult = config({
  path: join(__dirname, '..', '..', '..', '.env.local'),
});
if (parentResult.error) {
  console.warn('Failed to load parent .env.local file:', parentResult.error);
}

// Verify critical environment variables are loaded
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];
const missing = requiredVars.filter((varName) => !process.env[varName]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  console.error(
    'Current env vars:',
    Object.keys(process.env).filter(
      (k) => k.includes('SUPABASE') || k.includes('JWT'),
    ),
  );
}
