import { redirect } from 'next/navigation';

export default function DefaultStockTakePage() {
  redirect('/stock-take/cycle-count');
} 