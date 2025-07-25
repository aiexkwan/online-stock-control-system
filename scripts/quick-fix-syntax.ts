#!/usr/bin/env tsx
/**
 * 快速修復語法錯誤
 */

import { readFileSync, writeFileSync } from 'fs';

const files = [
  'app/admin/components/dashboard/charts/RealTimeInventoryMap.tsx',
  'app/admin/components/dashboard/charts/StocktakeAccuracyTrend.tsx',
  'app/admin/components/dashboard/charts/TopProductsInventoryChart.tsx',
  'app/admin/components/dashboard/widgets/OrderStateListWidgetV2.tsx',
];

files.forEach(file => {
  let content = readFileSync(file, 'utf-8');

  // 修復註釋後的代碼片段
  content = content.replace(
    /\/\/ TODO: Replace GraphQL\s*\n\s*\/\/ const { data, loading, error } = useGetInventoryLocationsQuery\({[^}]*}\);/g,
    `// TODO: Replace GraphQL - useGetInventoryLocationsQuery removed
  const data = null;
  const loading = false;
  const error = null;`
  );

  // 修復其他註釋問題
  content = content.replace(
    /\/\/ TODO: Replace GraphQL\s*\n\s*\/\/ ([^}]*}\);?)/g,
    '// TODO: Replace GraphQL - $1'
  );

  // 修復未完成的代碼塊
  content = content.replace(
    /\/\/ TODO: Replace GraphQL\s*\n\s*\/\/ ([^}]*)\n\s*([^\/\n])/g,
    '// TODO: Replace GraphQL - $1\n    // $2'
  );

  // 修復無效的語法
  content = content.replace(
    /skip: !isGraphQLEnabled,\s*pollInterval: 30000[^}]*}/g,
    '// skip: !isGraphQLEnabled, pollInterval: 30000'
  );

  writeFileSync(file, content);
  console.log(`✅ 修復: ${file}`);
});

console.log('\n✨ 完成語法修復');
