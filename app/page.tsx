import { redirect } from 'next/navigation';

export default function Home() {
  // 直接重定向到登入頁面
  redirect('/main-login');
}
