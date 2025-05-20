'use server';

import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WriteReadResult {
  writePayload: any;
  readValueInWriteAction: any;
  writeError?: any;
  readErrorInWriteAction?: any;
}

export async function testWriteThenReadAction(userId: number): Promise<WriteReadResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const timestamp = new Date().toISOString();
  const payload = { department: `TEST_WRITE_${timestamp}` };
  console.log(`[TestWriteThenRead] Attempting to write for user ${userId}:`, payload);

  let writeError, readErrorInWriteAction;
  let readValueInWriteAction = null;

  const { error: updateError } = await supabaseAdmin
    .from('data_id')
    .update(payload)
    .eq('id', userId);

  if (updateError) {
    console.error(`[TestWriteThenRead] Write error for user ${userId}:`, updateError);
    writeError = updateError;
  } else {
    console.log(`[TestWriteThenRead] Write successful for user ${userId}.`);
    // Now attempt to read it back immediately
    const { data: readData, error: readError } = await supabaseAdmin
      .from('data_id')
      .select('id, department, first_login, password')
      .eq('id', userId)
      .single();
    
    if (readError) {
      console.error(`[TestWriteThenRead] Read error (within same action) for user ${userId}:`, readError);
      readErrorInWriteAction = readError;
    } else {
      console.log(`[TestWriteThenRead] Read back (within same action) for user ${userId}:`, readData);
      readValueInWriteAction = readData;
    }
  }
  return { writePayload: payload, readValueInWriteAction, writeError, readErrorInWriteAction };
}

interface ReadResult {
  readValueInReadAction: any;
  readError?: any;
}
export async function testJustReadAction(userId: number): Promise<ReadResult> {
  const supabaseAdmin = getSupabaseAdmin();
  console.log(`[TestJustRead] Attempting to read for user ${userId}`);
  const { data, error } = await supabaseAdmin
    .from('data_id')
    .select('id, department, first_login, password')
    .eq('id', userId)
    .single();

  if (error) {
    console.error(`[TestJustRead] Read error for user ${userId}:`, error);
  } else {
    console.log(`[TestJustRead] Read data for user ${userId}:`, data);
  }
  return { readValueInReadAction: data, readError: error };
} 