import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file in backend directory
config({ path: join(__dirname, '..', '.env') });

// Also try to load from parent directory's .env.local (for shared configs)
config({ path: join(__dirname, '..', '..', '..', '.env.local') });
