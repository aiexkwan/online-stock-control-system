'use server';

import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Use environment variables for Supabase URL and Service Role Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use the Service Role Key to bypass RLS for inserting the request
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in environment variables for server action.');
  // Optionally throw an error or handle appropriately
}

// Create a separate Supabase client instance using the service role key
// This client has admin privileges and bypasses RLS.
const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
        // Required options for server-side clients
        autoRefreshToken: false,
        persistSession: false
    }
});

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function requestPasswordResetAction(userId: string): Promise<ActionResult> {
  console.log(`[Action] Received password reset request for user: ${userId}`);
  
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }

  try {
    // Check if a pending request already exists for this user
    const { data: existingRequest, error: checkError } = await supabaseAdmin
      .from('password_reset_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle(); // Use maybeSingle as there should be at most one pending request

    if (checkError) {
      console.error('[Action] Error checking for existing request:', checkError);
      return { success: false, error: 'Database error checking existing requests.' };
    }

    if (existingRequest) {
      console.log(`[Action] Pending reset request already exists for user: ${userId}`);
      return { success: false, error: 'A password reset request for this user is already pending.' };
    }

    // Insert the new request
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_requests')
      .insert({ 
          user_id: userId, 
          status: 'pending' 
          // requested_at is handled by default value
      });

    if (insertError) {
      console.error('[Action] Error inserting password reset request:', insertError);
      return { success: false, error: 'Failed to submit password reset request.' };
    }

    console.log(`[Action] Password reset request successfully submitted for user: ${userId}`);
    
    // Optionally log to record_history as well (using the same admin client)
    try {
        await supabaseAdmin.from('record_history').insert({
            time: new Date().toISOString(),
            id: userId, // Log against the user who requested
            action: 'Password Reset Request',
            remark: 'User requested password reset'
        });
    } catch (historyError) {
        console.warn('[Action] Failed to log password reset request to history:', historyError);
        // Don't fail the whole action if history logging fails
    }

    return { success: true };

  } catch (error) {
    console.error('[Action] Unexpected error in requestPasswordResetAction:', error);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
} 