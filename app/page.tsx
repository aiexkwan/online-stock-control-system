import { redirect } from 'next/navigation';

// 根路徑重定向到登入頁面
export default function RootPage() {
  redirect('/main-login');
}
