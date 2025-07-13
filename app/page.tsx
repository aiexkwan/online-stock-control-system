import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  // 測試模式下顯示簡單首頁，用於性能測試
  if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
    return (
      <div className="min-h-screen bg-[#181c2f] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">NewPennine WMS</h1>
          <p className="text-gray-400">Test Mode - Performance Testing</p>
          <div className="mt-8 space-y-2">
            <Link href="/admin/injection" className="block text-blue-400 hover:underline">
              Admin Dashboard (Injection)
            </Link>
            <Link href="/admin/pipeline" className="block text-blue-400 hover:underline">
              Admin Dashboard (Pipeline)
            </Link>
            <Link href="/admin/warehouse" className="block text-blue-400 hover:underline">
              Admin Dashboard (Warehouse)
            </Link>
            <Link href="/access" className="block text-blue-400 hover:underline">
              Access Page
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // 將根路由重定向到主登入頁面
  redirect('/main-login');
}
