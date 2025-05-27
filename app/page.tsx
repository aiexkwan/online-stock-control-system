import { redirect } from 'next/navigation';

export default function Home() {
  // 將根路由重定向到主登入頁面
  redirect('/main-login');
} 