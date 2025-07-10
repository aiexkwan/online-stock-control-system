import { createClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs'; // Import bcryptjs

export interface UserData {
  id: string;
  name: string;
  department: string;
  // password?: string; // REMOVE: Password should not be part of UserData returned to client
  permissions: {
    qc: boolean;
    receive: boolean;
    void: boolean;
    view: boolean;
    resume: boolean;
    report: boolean;
  };
}

// Define the structure of the raw user data fetched from Supabase
interface RawUserDataFromDB {
  id: string;
  name: string;
  department: string;
  password?: string | null;
  first_login?: boolean | null;
  // Individual permission fields as they are in the data_id table
  qc?: boolean | null;
  receive?: boolean | null;
  void?: boolean | null;
  view?: boolean | null;
  resume?: boolean | null;
  report?: boolean | null;
}

export async function authenticateUser(
  userId: string,
  passwordInput: string
): Promise<{
  success: boolean;
  user?: UserData;
  isFirstLogin?: boolean;
  isTemporaryLogin?: boolean; // Add new flag for temporary login
  error?: string;
}> {
  const supabase = await createClient();
  try {
    const { data: rawUserData, error: userFetchError } = await supabase
      .from('data_id')
      .select(
        'id, name, department, password, first_login, qc, receive, void, view, resume, report'
      )
      .eq('id', userId)
      .single();

    if (userFetchError) {
      console.error('User query error:', userFetchError);
      if (userFetchError.code === 'PGRST116') {
        return { success: false, error: `User ${userId} not found.` };
      }
      return { success: false, error: 'Error fetching user data.' };
    }

    if (!rawUserData) {
      return { success: false, error: `User ${userId} not found.` };
    }

    const userDataFromDB = rawUserData as RawUserDataFromDB; // Now this cast should be safer

    const clientUserData: UserData = {
      id: userDataFromDB.id,
      name: userDataFromDB.name,
      department: userDataFromDB.department,
      permissions: {
        // Construct the permissions object here
        qc: !!userDataFromDB.qc,
        receive: !!userDataFromDB.receive,
        void: !!userDataFromDB.void,
        view: !!userDataFromDB.view,
        resume: !!userDataFromDB.resume,
        report: !!userDataFromDB.report,
      },
    };

    if (userDataFromDB.first_login === true) {
      if (passwordInput === userId) {
        return {
          success: true,
          user: clientUserData,
          isFirstLogin: true,
        };
      } else {
        return { success: false, error: 'Incorrect Clock Number for first login.' };
      }
    } else {
      // This implies first_login is false or null/undefined (treat null/undefined as not first_login for robustness)
      if (!userDataFromDB.password) {
        console.error(`User ${userId} has first_login=false (or null) but no password set.`);
        return { success: false, error: 'User account configuration error. Please contact admin.' };
      }

      // --- Compare using bcrypt ---
      const isPasswordMatch = bcrypt.compareSync(passwordInput, userDataFromDB.password);

      if (isPasswordMatch) {
        return {
          success: true,
          user: clientUserData,
          isFirstLogin: false,
        };
      } else {
        // --- Password INCORRECT - Check for Pending Reset Request ---
        (process.env.NODE_ENV as string) !== 'production' &&
          (process.env.NODE_ENV as string) !== 'production' &&
          console.log(`Password mismatch for ${userId}. Checking for pending reset request...`);

        // --- Explicitly parse userId to integer for query ---
        const userIdInt = parseInt(userId, 10);
        if (isNaN(userIdInt)) {
          console.error(`Invalid userId format for reset check: ${userId}`);
          // Return generic password error if userId isn't a number somehow
          return { success: false, error: 'Incorrect password.' };
        }
        // --- End of parsing ---

        const { data: pendingRequest, error: requestCheckError } = await supabase
          .from('password_reset_requests')
          .select('id')
          .eq('user_id', userIdInt) // Use the integer userId for the query
          .eq('status', 'pending')
          .maybeSingle();

        if (requestCheckError) {
          console.error('Error checking password_reset_requests:', requestCheckError);
          // Don't expose db error, return generic password error
          return { success: false, error: 'Incorrect password.' };
        }

        if (pendingRequest) {
          // Pending request FOUND - Grant temporary access
          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log(`Pending reset request found for ${userId}. Granting temporary access.`);
          return {
            success: true,
            user: clientUserData,
            isFirstLogin: false, // Not a first login scenario
            isTemporaryLogin: true, // Indicate temporary access
          };
        } else {
          // No pending request - Just an incorrect password
          (process.env.NODE_ENV as string) !== 'production' &&
            (process.env.NODE_ENV as string) !== 'production' &&
            console.log(`No pending reset request found for ${userId}.`);
          return { success: false, error: 'Incorrect password.' };
        }
      }
    }
  } catch (error) {
    console.error('Unexpected authentication error:', error);
    return {
      success: false,
      error: 'Login failed due to a system error. Please try again later.',
    };
  }
}
