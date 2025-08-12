'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // 客戶端重定向到登入頁面
    router.push('/main-login');
  }, [router]);
  
  return null;
}
