'use client';

// import { getCookie } from 'cookies-next'; // No longer relying on custom cookie for clock number
// import { supabase } from '@/lib/supabase'; // Avoid global instance here, components should create their own

/**
 * [DEPRECATED or NEEDS REWORK with @supabase/ssr]
 * synchronizeAuthState was used for manual sync between cookie, localStorage, and Supabase session.
 * With @supabase/ssr, session management is largely handled by the middleware and client libraries.
 * This function might be removable or significantly simplified.
 */
// export function synchronizeAuthState(): Promise<void> { ... } // Removed

/**
 * [NEEDS REWORK/REVIEW with @supabase/ssr]
 * Attempts to get the clock number. Previously relied on localStorage or a custom cookie.
 * With @supabase/ssr, components should ideally get user info directly from `supabase.auth.getUser()`.
 * This function is kept for now but might be deprecated.
 */
export function getLoggedInClockNumber(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Primary source should be user metadata from an active Supabase session.
  // This function, if kept, should be a simple localStorage reader as a last resort or for non-session critical info.
  const fromLocalStorage = localStorage.getItem('loggedInUserClockNumber');
  if (fromLocalStorage) {
    return fromLocalStorage;
  }
  
  // console.warn('[getLoggedInClockNumber] Clock number not found in localStorage. Consider fetching from Supabase session directly in components.');
  return null;
}

/**
 * Helper function to store clock number to localStorage if needed by other parts of the app.
 * Call this after successfully fetching user data that includes clock_number.
 */
export function storeClockNumberLocally(clockNumber: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('loggedInUserClockNumber', clockNumber);
  }
}

/**
 * Helper function to clear local clock number storage on logout.
 */
export function clearLocalClockNumber(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('loggedInUserClockNumber');
    // also clear other related auth items if any, e.g., 'firstLogin' if it was set by client side logic
    localStorage.removeItem('firstLogin'); 
  }
} 