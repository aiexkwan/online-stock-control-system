import { SupabaseClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

const SERIES_DATE_FORMAT = 'ddMMyy'; // Centralized date format
const RANDOM_PART_LENGTH = 6;
const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generates a single unique series string.
 * Format: ddMMyy-XXXXXX
 * Checks against the 'record_palletinfo' table for uniqueness.
 * @param supabaseClient - The Supabase client instance.
 * @returns A promise that resolves to a unique series string.
 * @throws Error if a unique series cannot be generated after a reasonable number of attempts.
 */
export async function generateUniqueSeries(supabaseClient: SupabaseClient): Promise<string> {
  const datePart = format(new Date(), SERIES_DATE_FORMAT);
  let attempts = 0;
  const maxAttempts = 20; // Reasonable limit to prevent infinite loops in extreme cases

  while (attempts < maxAttempts) {
    let randomPart = '';
    for (let i = 0; i < RANDOM_PART_LENGTH; i++) {
      randomPart += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
    }
    const candidateSeries = `${datePart}-${randomPart}`;
    attempts++;

    try {
      const { data: existing, error } = await supabaseClient
        .from('record_palletinfo')
        .select('series')
        .eq('series', candidateSeries)
        .limit(1);

      if (error) {
        console.error('Error checking series uniqueness in DB:', error);
        // Decide how to handle DB errors, e.g., rethrow or try a few more times.
        // For now, we'll let it try a few more times if 'attempts' allows.
      } else if (!existing || existing.length === 0) {
        return candidateSeries; // Unique series found
      }
    } catch (dbCheckError) {
      console.error('Unexpected error during DB check for series uniqueness:', dbCheckError);
      // Handle unexpected errors, maybe rethrow or log.
    }
    // If series exists or an error occurred (and we're retrying), loop again.
  }
  // If loop finishes, it means we couldn't generate a unique series
  throw new Error(`Failed to generate a unique series after ${maxAttempts} attempts.`);
}

/**
 * Generates multiple unique series strings.
 * @param count - The number of unique series strings to generate.
 * @param supabaseClient - The Supabase client instance.
 * @returns A promise that resolves to an array of unique series strings.
 * @throws Error if enough unique series cannot be generated.
 */
export async function generateMultipleUniqueSeries(
  count: number,
  supabaseClient: SupabaseClient
): Promise<string[]> {
  if (count <= 0) {
    return [];
  }
  const generatedSeries: string[] = [];
  const datePart = format(new Date(), SERIES_DATE_FORMAT); // Get date part once for the batch

  let totalAttempts = 0;
  const maxTotalAttempts = count * 10; // Allow more attempts overall for multiple series

  while (generatedSeries.length < count && totalAttempts < maxTotalAttempts) {
    let randomPart = '';
    for (let i = 0; i < RANDOM_PART_LENGTH; i++) {
      randomPart += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
    }
    const candidateSeries = `${datePart}-${randomPart}`;
    totalAttempts++;

    // Check local uniqueness first (within the current batch being generated)
    if (generatedSeries.includes(candidateSeries)) {
      continue; // Already generated in this batch, try again
    }

    try {
      const { data: existingInDb, error: dbError } = await supabaseClient
        .from('record_palletinfo')
        .select('series')
        .eq('series', candidateSeries)
        .limit(1);

      if (dbError) {
        console.error('Error checking series uniqueness in DB (multiple):', dbError);
        // Potentially skip this candidate or retry, depending on error strategy
      } else if (!existingInDb || existingInDb.length === 0) {
        generatedSeries.push(candidateSeries); // Unique in DB and locally
      }
    } catch (dbCheckError) {
      console.error(
        'Unexpected error during DB check for series uniqueness (multiple):',
        dbCheckError
      );
    }
  }

  if (generatedSeries.length < count) {
    const errorMessage = `Could not generate enough unique series. Requested: ${count}, Generated: ${generatedSeries.length}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return generatedSeries;
}
