import { createClient } from '@/lib/supabase';

export interface SearchSuggestion {
  value: string;
  type: 'product_code' | 'location' | 'pallet_num';
  label: string;
  count?: number;
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (!query || query.length < 2) return [];

  const supabase = await createClient();
  const suggestions: SearchSuggestion[] = [];

  try {
    // Get product code suggestions
    const { data: productCodes } = await supabase
      .from('record_palletinfo')
      .select('product_code')
      .ilike('product_code', `${query}%`)
      .limit(5);

    if (productCodes) {
      // Count occurrences of each product code
      const productCodeCounts = productCodes.reduce(
        (acc, item) => {
          acc[item.product_code] = (acc[item.product_code] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get unique product codes
      const uniqueProductCodes = Object.keys(productCodeCounts);

      uniqueProductCodes.forEach(code => {
        suggestions.push({
          value: code,
          type: 'product_code',
          label: `Product: ${code}`,
          count: productCodeCounts[code as string],
        });
      });
    }

    // Get pallet number suggestions if query contains '/'
    if (query.includes('/')) {
      const { data: palletNums } = await supabase
        .from('record_palletinfo')
        .select('plt_num')
        .ilike('plt_num', `${query}%`)
        .limit(5);

      if (palletNums) {
        palletNums.forEach(item => {
          suggestions.push({
            value: item.plt_num,
            type: 'pallet_num',
            label: `Pallet: ${item.plt_num}`,
          });
        });
      }
    }

    // Get location suggestions from record_history
    const { data: locations } = await supabase
      .from('record_history')
      .select('loc')
      .ilike('loc', `${query}%`)
      .not('loc', 'is', null)
      .limit(5);

    if (locations) {
      // Get unique locations
      const uniqueLocations = [...new Set(locations.map((l: any) => l.loc))];

      uniqueLocations.forEach(loc => {
        if (loc) {
          suggestions.push({
            value: loc,
            type: 'location',
            label: `Location: ${loc}`,
          });
        }
      });
    }

    // Sort suggestions by relevance
    suggestions.sort((a, b) => {
      // Exact matches first
      if (a.value.toLowerCase() === query.toLowerCase()) return -1;
      if (b.value.toLowerCase() === query.toLowerCase()) return 1;

      // Then by count (if available)
      if (a.count && b.count) return b.count - a.count;

      // Then by type priority
      const typePriority = { pallet_num: 1, product_code: 2, location: 3 };
      return typePriority[a.type] - typePriority[b.type];
    });

    return suggestions.slice(0, 8); // Return top 8 suggestions
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return [];
  }
}

export async function getPopularSearches(): Promise<SearchSuggestion[]> {
  const supabase = await createClient();
  const suggestions: SearchSuggestion[] = [];

  try {
    // Get most common product codes from recent pallets
    const { data: popularProducts } = await supabase
      .from('record_palletinfo')
      .select('product_code')
      .order('generate_time', { ascending: false })
      .limit(100);

    if (popularProducts) {
      // Count occurrences
      const productCounts = popularProducts.reduce(
        (acc, item) => {
          acc[item.product_code] = (acc[item.product_code] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get top 5 products
      Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([code, count]) => {
          suggestions.push({
            value: code,
            type: 'product_code',
            label: `Product: ${code}`,
            count,
          });
        });
    }

    return suggestions;
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    return [];
  }
}
