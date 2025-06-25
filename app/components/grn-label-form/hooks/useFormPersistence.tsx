import { useCallback, useEffect, useState, useMemo } from 'react';
import { debounce } from 'lodash';

const STORAGE_KEY = 'grn-label-form-data';
const STORAGE_VERSION = '1.0';
const EXPIRY_HOURS = 24;

interface FormData {
  grnNumber: string;
  materialSupplier: string;
  productCode: string;
  labelMode: 'qty' | 'weight';
  palletType: {
    whiteDry: string;
    whiteWet: string;
    chepDry: string;
    chepWet: string;
    euro: string;
    notIncluded: string;
  };
  packageType: {
    still: string;
    bag: string;
    tote: string;
    octo: string;
    notIncluded: string;
  };
  grossWeights: string[];
}

interface StoredFormData {
  version: string;
  timestamp: number;
  data: Partial<FormData>;
}

export function useFormPersistence(isEnabled: boolean = true) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Save form data to localStorage
  const saveFormData = useCallback((data: Partial<FormData>) => {
    if (!isEnabled) return;
    
    try {
      const storedData: StoredFormData = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        data
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[GRN useFormPersistence] Form data saved');
    } catch (error) {
      console.error('[GRN useFormPersistence] Failed to save form data:', error);
    }
  }, [isEnabled]);
  
  // Debounced save function
  const debouncedSave = useMemo(
    () => debounce((data: Partial<FormData>) => {
      saveFormData(data);
    }, 1000),
    [saveFormData]
  );
  
  // Load form data from localStorage
  const loadFormData = useCallback((): Partial<FormData> | null => {
    if (!isEnabled) return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed: StoredFormData = JSON.parse(stored);
      
      // Check version
      if (parsed.version !== STORAGE_VERSION) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[GRN useFormPersistence] Version mismatch, clearing stored data');
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      // Check expiry
      const expiryMs = EXPIRY_HOURS * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > expiryMs) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[GRN useFormPersistence] Data expired, clearing stored data');
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[GRN useFormPersistence] Form data loaded');
      return parsed.data;
    } catch (error) {
      console.error('[GRN useFormPersistence] Failed to load form data:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);
  
  // Clear stored form data
  const clearFormData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[GRN useFormPersistence] Form data cleared');
    } catch (error) {
      console.error('[GRN useFormPersistence] Failed to clear form data:', error);
    }
  }, []);
  
  // Initialize on mount
  useEffect(() => {
    setIsLoading(false);
  }, []);
  
  return {
    saveFormData: debouncedSave,
    loadFormData,
    clearFormData,
    isLoading
  };
}