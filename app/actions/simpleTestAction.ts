'use server';
import { cookies } from 'next/headers';

export async function testServerActionReceivesCookie() {
  console.log(`[simpleTestAction] EXECUTING AT ${new Date().toISOString()}`);
  const cookieStore = cookies();
  const testCookie = cookieStore.get('middleware-test-cookie');
  const allCookieNames = cookieStore.getAll().map(c => c.name);

  console.log('[simpleTestAction] All available cookie names:', allCookieNames);
  if (testCookie) {
    console.log('[simpleTestAction] SUCCESS: "middleware-test-cookie" received! Value:', testCookie.value);
    return { success: true, message: "Test cookie received!", cookieValue: testCookie.value, allCookies: allCookieNames };
  } else {
    console.log('[simpleTestAction] FAILURE: "middleware-test-cookie" NOT received.');
    return { success: false, message: "Test cookie NOT received.", allCookies: allCookieNames };
  }
} 