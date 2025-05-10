import { supabase } from '@/lib/supabase';

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

export async function authenticateUser(userId: string, passwordInput: string): Promise<{
  success: boolean;
  user?: UserData; 
  isFirstLogin?: boolean;
  error?: string;
}> {
  try {
    const { data: rawUserData, error: userFetchError } = await supabase
      .from('data_id')
      .select('id, name, department, password, first_login, qc, receive, void, view, resume, report')
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
      permissions: { // Construct the permissions object here
        qc: !!userDataFromDB.qc,
        receive: !!userDataFromDB.receive,
        void: !!userDataFromDB.void,
        view: !!userDataFromDB.view,
        resume: !!userDataFromDB.resume,
        report: !!userDataFromDB.report,
      }
    };

    if (userDataFromDB.first_login === true) {
      if (passwordInput === userId) {
        return {
          success: true,
          user: clientUserData,
          isFirstLogin: true
        };
      } else {
        return { success: false, error: 'Incorrect Clock Number for first login.' };
      }
    } else { // This implies first_login is false or null/undefined (treat null/undefined as not first_login for robustness)
      if (!userDataFromDB.password) {
        console.error(`User ${userId} has first_login=false (or null) but no password set.`);
        return { success: false, error: 'User account configuration error. Please contact admin.' };
      }
      if (passwordInput === userDataFromDB.password) {
        return {
          success: true,
          user: clientUserData,
          isFirstLogin: false
        };
      } else {
        return { success: false, error: 'Incorrect password.' };
      }
    }

  } catch (error) {
    console.error('Unexpected authentication error:', error);
    return {
      success: false,
      error: 'Login failed due to a system error. Please try again later.'
    };
  }
} 