'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
// Debounce utility

export interface SupplierInfo {
  supplier_code: string;
  supplier_name: string;
}

export interface SupplierSuggestion extends SupplierInfo {
  match_type: 'code' | 'name';
  match_score?: number;
}

export interface UseSupplierValidationOptions {
  /** Enable fuzzy search for suggestions */
  enableFuzzySearch?: boolean;
  /** Maximum number of suggestions */
  maxSuggestions?: number;
  /** Debounce delay for search (ms) */
  searchDebounceDelay?: number;
  /** Auto-validate on mount with initial value */
  autoValidateOnMount?: boolean;
}

export interface UseSupplierValidationReturn {
  /** Current supplier info if validated */
  supplierInfo: SupplierInfo | null;
  /** Validation error message */
  error: string | null;
  /** Is currently validating */
  isValidating: boolean;
  /** Validate a supplier code */
  validateSupplier: (code: string) => Promise<SupplierInfo | null>;
  /** Clear supplier info and error */
  clearSupplier: () => void;
  /** Search for supplier suggestions */
  searchSuppliers: (searchTerm: string) => Promise<SupplierSuggestion[]>;
  /** Current suggestions */
  suggestions: SupplierSuggestion[];
  /** Is currently searching */
  isSearching: boolean;
  /** Clear suggestions */
  clearSuggestions: () => void;
  /** Debounced search function */
  debouncedSearch: (searchTerm: string) => void;
}

/**
 * Unified supplier validation hook
 * 統一的供應商驗證 Hook
 *
 * @deprecated This hook is deprecated. Please use Server Actions from '@/app/actions/supplierActions' instead.
 * For server-side validation, use validateSupplierCode() and searchSuppliers().
 * For client-side functionality like debounced search, consider using a thin wrapper around Server Actions.
 *
 * @example
 * ```typescript
 * // OLD (deprecated)
 * const supplierValidation = useSupplierValidation({
 *   enableFuzzySearch: true,
 *   maxSuggestions: 10
 * });
 *
 * // NEW (recommended)
 * import { validateSupplierCode, searchSuppliers } from '@/app/actions/supplierActions';
 *
 * const result = await validateSupplierCode('SUP001');
 * const suggestions = await searchSuppliers('metal', { enableFuzzySearch: true, maxSuggestions: 10 });
 * ```
 */
export function useSupplierValidation(
  options: UseSupplierValidationOptions = {}
): UseSupplierValidationReturn {
  const {
    enableFuzzySearch = false,
    maxSuggestions = 10,
    searchDebounceDelay = 300,
    autoValidateOnMount = false,
  } = options;

  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [suggestions, setSuggestions] = useState<SupplierSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const supabase = createClient();
  const searchAbortController = useRef<AbortController | null>(null);

  /**
   * Validate a supplier code
   */
  const validateSupplier = useCallback(
    async (code: string): Promise<SupplierInfo | null> => {
      // Clear if empty
      if (!code.trim()) {
        setSupplierInfo(null);
        setError(null);
        return null;
      }

      setIsValidating(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('data_supplier')
          .select('supplier_code, supplier_name')
          .eq('supplier_code', code.toUpperCase())
          .single();

        if (queryError || !data) {
          setSupplierInfo(null);
          setError('Supplier Code Not Found');
          return null;
        }

        const supplierInfo = {
          supplier_code: data.supplier_code,
          supplier_name: data.supplier_name || '',
        };
        setSupplierInfo(supplierInfo);
        setError(null);
        return supplierInfo;
      } catch (err) {
        console.error('[useSupplierValidation] Error validating supplier:', err);
        setSupplierInfo(null);
        setError('Error validating supplier');
        return null;
      } finally {
        setIsValidating(false);
      }
    },
    [supabase]
  );

  /**
   * Search for supplier suggestions
   */
  const searchSuppliers = useCallback(
    async (searchTerm: string): Promise<SupplierSuggestion[]> => {
      if (!searchTerm.trim()) {
        setSuggestions([]);
        return [];
      }

      // Cancel previous search
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
      searchAbortController.current = new AbortController();

      setIsSearching(true);

      try {
        const upperSearchTerm = searchTerm.toUpperCase();
        let query = supabase.from('data_supplier').select('supplier_code, supplier_name');

        if (enableFuzzySearch) {
          // Fuzzy search on both code and name
          query = query.or(
            `supplier_code.ilike.%${upperSearchTerm}%,supplier_name.ilike.%${searchTerm}%`
          );
        } else {
          // Exact prefix matching
          query = query.or(
            `supplier_code.ilike.${upperSearchTerm}%,supplier_name.ilike.${searchTerm}%`
          );
        }

        const { data, error } = await query
          .limit(maxSuggestions * 2) // Get more to filter later
          .order('supplier_code');

        if (error) throw error;

        if (data) {
          // Score and sort suggestions
          const scoredSuggestions: SupplierSuggestion[] = data.map(supplier => {
            const codeMatch = supplier.supplier_code.includes(upperSearchTerm);
            const nameMatch = (supplier.supplier_name || '')
              .toLowerCase()
              .includes(searchTerm.toLowerCase());

            // Calculate match score
            let score = 0;
            if (supplier.supplier_code === upperSearchTerm) score = 100;
            else if (supplier.supplier_code.startsWith(upperSearchTerm)) score = 80;
            else if (codeMatch) score = 60;
            else if (
              (supplier.supplier_name || '').toLowerCase().startsWith(searchTerm.toLowerCase())
            )
              score = 40;
            else if (nameMatch) score = 20;

            return {
              supplier_code: supplier.supplier_code,
              supplier_name: supplier.supplier_name || '',
              match_type: codeMatch ? ('code' as const) : ('name' as const),
              match_score: score,
            };
          });

          // Sort by score and limit
          const sortedSuggestions = scoredSuggestions
            .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
            .slice(0, maxSuggestions);

          setSuggestions(sortedSuggestions);
          return sortedSuggestions;
        }

        setSuggestions([]);
        return [];
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[useSupplierValidation] Error searching suppliers:', err);
        }
        setSuggestions([]);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [enableFuzzySearch, maxSuggestions, supabase]
  );

  // Debounce timeout ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Debounced search function
   */
  const debouncedSearch = useCallback(
    (searchTerm: string) => {
      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        searchSuppliers(searchTerm);
      }, searchDebounceDelay);
    },
    [searchSuppliers, searchDebounceDelay]
  );

  /**
   * Clear supplier info and error
   */
  const clearSupplier = useCallback(() => {
    setSupplierInfo(null);
    setError(null);
  }, []);

  /**
   * Clear suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    supplierInfo,
    error,
    isValidating,
    validateSupplier,
    clearSupplier,
    searchSuppliers,
    suggestions,
    isSearching,
    clearSuggestions,
    debouncedSearch,
  };
}

export default useSupplierValidation;
