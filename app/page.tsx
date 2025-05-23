import { redirect } from 'next/navigation';

export default function Home() {
  // 將根路由重定向到開放訪問的 Dashboard
  redirect('/dashboard/open-access');
} 