import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

console.log('Current working directory:', process.cwd());
console.log('Loading .env.local from:', path.resolve(process.cwd(), '.env.local'));

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Environment variables loaded:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ (set)' : '✗ (not set)');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ (set)' : '✗ (not set)');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

async function initializeAuth() {
  try {
    console.log('Starting authentication system initialization...');

    // Fetch all users from data_id table
    const { data: users, error: usersError } = await supabase
      .from('data_id')
      .select('*');

    if (usersError) {
      throw usersError;
    }

    console.log(`Found ${users.length} users to process`);

    // Create or update auth account for each user
    for (const user of users) {
      const email = `${user.id}@pennine.com`;
      const password = user.password || user.id;

      try {
        // Check if user already exists
        const { data: { users: existingUsers }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error(`Error listing users:`, listError);
          continue;
        }

        const existingUser = existingUsers.find(u => u.email === email);

        if (!existingUser) {
          // Create new user
          const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              id: user.id,
              name: user.name,
              department: user.department,
              permissions: {
                qc: user.qc,
                receive: user.receive,
                void: user.void,
                view: user.view,
                resume: user.resume,
                report: user.report
              }
            }
          });

          if (createError) {
            console.error(`Error creating user ${user.id}:`, createError);
          } else {
            console.log(`Created auth account for user ${user.id}`);
          }
        } else {
          // Update existing user
          const { data, error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              password,
              user_metadata: {
                id: user.id,
                name: user.name,
                department: user.department,
                permissions: {
                  qc: user.qc,
                  receive: user.receive,
                  void: user.void,
                  view: user.view,
                  resume: user.resume,
                  report: user.report
                }
              }
            }
          );

          if (updateError) {
            console.error(`Error updating user ${user.id}:`, updateError);
          } else {
            console.log(`Updated auth account for user ${user.id}`);
          }
        }
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err);
      }
    }

    console.log('Authentication system initialization completed');
  } catch (err) {
    console.error('Authentication system initialization failed:', err);
  }
}

initializeAuth(); 