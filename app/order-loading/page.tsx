'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { UnifiedSearch } from '../../components/ui/unified-search';
import { createClient } from '../utils/supabase/client';
import { toast } from 'sonner';
import { 
  UserIcon, 
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { loadPalletToOrder } from '@/app/actions/orderLoadingActions';

interface OrderData {
  order_ref: string;
  product_code: string;
  product_desc: string;
  product_qty: string;
  loaded_qty: string;
}

export default function OrderLoadingPage() {
  const supabase = createClient();
  
  // State management
  const [idNumber, setIdNumber] = useState('');
  const [isIdValid, setIsIdValid] = useState(false);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<string[]>([]);
  const [selectedOrderRef, setSelectedOrderRef] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs
  const idInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<any>(null);

  // Auto focus on ID input when page loads
  useEffect(() => {
    if (idInputRef.current) {
      idInputRef.current.focus();
    }
  }, []);

  // Check if ID exists in data_id table
  const checkIdExists = async (id: string) => {
    // Ensure ID is 4 digits
    if (!id || id.length !== 4 || !/^\d{4}$/.test(id)) {
      setIsIdValid(false);
      setAvailableOrders([]);
      setSelectedOrderRef(null);
      setOrderData([]);
      return;
    }

    setIsCheckingId(true);
    
    try {
      const { data, error } = await supabase
        .from('data_id')
        .select('id')
        .eq('id', id)
        .single();

      if (error || !data) {
        setIsIdValid(false);
        setAvailableOrders([]);
        setSelectedOrderRef(null);
        setOrderData([]);
        toast.error(`ID ${id} does not exist in the system, please check and try again`);
      } else {
        setIsIdValid(true);
        await fetchAvailableOrders();
      }
    } catch (error) {
      console.error('Error checking ID:', error);
      setIsIdValid(false);
      toast.error('Error occurred while checking ID');
    } finally {
      setIsCheckingId(false);
    }
  };

  // Fetch available order references from data_order table
  const fetchAvailableOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('data_order')
        .select('order_ref')
        .order('order_ref', { ascending: true });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Error occurred while fetching order list');
        return;
      }

      // Get unique order references
      const uniqueOrderRefs = [...new Set(data.map(item => item.order_ref))];
      setAvailableOrders(uniqueOrderRefs);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Error occurred while fetching order list');
    }
  };

  // Fetch order data from data_order table
  const fetchOrderData = async (orderRef: string) => {
    setIsLoadingOrders(true);
    
    try {
      const { data, error } = await supabase
        .from('data_order')
        .select('order_ref, product_code, product_desc, product_qty, loaded_qty')
        .eq('order_ref', orderRef)
        .order('product_code', { ascending: true });

      if (error) {
        console.error('Error fetching order data:', error);
        toast.error('Error occurred while fetching order data');
        return;
      }

      setOrderData(data || []);
    } catch (error) {
      console.error('Error fetching order data:', error);
      toast.error('Error occurred while fetching order data');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Handle ID input change
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '');
    
    // Limit to 4 digits maximum
    const truncatedValue = value.slice(0, 4);
    setIdNumber(truncatedValue);
    
    // Reset states if necessary
    if (isIdValid) {
      setIsIdValid(false);
      setAvailableOrders([]);
      setSelectedOrderRef(null);
      setOrderData([]);
    }
    
    // Automatically check ID if 4 digits are entered
    if (truncatedValue.length === 4) {
      checkIdExists(truncatedValue);
    }
  };

  // Handle ID input blur (when user finishes typing)
  const handleIdBlur = () => {
    // Only check if ID is 4 digits
    if (idNumber.length === 4) {
      checkIdExists(idNumber);
    } else if (idNumber.length > 0 && idNumber.length < 4) {
      // Show warning if digits are less than 4
      toast.warning('ID must be 4 digits');
    }
  };

  // Handle Enter key press in ID input
  const handleIdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Only check if ID is 4 digits
      if (idNumber.length === 4) {
        checkIdExists(idNumber);
      } else if (idNumber.length > 0 && idNumber.length < 4) {
        // Show warning if digits are less than 4
        toast.warning('ID must be 4 digits');
      }
    }
  };

  // Handle order selection
  const handleOrderSelect = (orderRef: string) => {
    setSelectedOrderRef(orderRef);
    fetchOrderData(orderRef);
    
    // Auto focus on search input after order selection
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  // Handle search selection (same as stock-transfer)
  const handleSearchSelect = async (result: any) => {
    if (!selectedOrderRef) {
      toast.error('Please select an order first');
      return;
    }

    setIsSearching(true);
    try {
      const response = await loadPalletToOrder(selectedOrderRef, result.data.value);
      
      if (response.success) {
        toast.success(response.message);
        
        // Refresh order data
        await fetchOrderData(selectedOrderRef);
        
        // Show loaded pallet details
        if (response.data) {
          toast.success(
            `Loaded: ${response.data.productCode} - Qty: ${response.data.productQty}`,
            {
              description: `Total loaded: ${response.data.updatedLoadedQty}`
            }
          );
        }
        
        // Clear search value after successful scan
        setSearchValue('');
        
        // Refocus on search input
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error loading pallet:', error);
      toast.error('Failed to load pallet');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent mb-2">
            Order Loading
          </h1>
          <p className="text-slate-400 text-lg">
            Manage order loading process
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - ID Input and Order Selection */}
          <div className="space-y-6">
            {/* ID Input Card */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-200">
                  <UserIcon className="h-6 w-6 mr-2 text-blue-400" />
                  Enter ID Number
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      ref={idInputRef}
                      type="text"
                      value={idNumber}
                      onChange={handleIdChange}
                      onBlur={handleIdBlur}
                      onKeyDown={handleIdKeyDown}
                      placeholder="Enter 4-digit ID..."
                      maxLength={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                      disabled={isCheckingId}
                    />
                    {isCheckingId && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* ID format hint */}
                  <p className="text-xs text-slate-400">
                    Please enter your 4-digit employee ID
                  </p>
                  
                  {/* ID Status Indicator - Only show error state */}
                  {idNumber.length === 4 && !isCheckingId && !isIdValid && (
                    <div className="flex items-center space-x-2 text-sm text-red-400">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span>ID does not exist</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Selection Card */}
            {isIdValid && availableOrders.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-200">
                    <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-green-400" />
                    Choose order below
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedOrderRef || ''}
                    onChange={(e) => handleOrderSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300"
                  >
                    <option value="">Please select an order...</option>
                    {availableOrders.map((orderRef) => (
                      <option key={orderRef} value={orderRef}>
                        Order #{orderRef}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Order Information and Search */}
          <div className="space-y-6">
            {/* Order Information Card */}
            {selectedOrderRef && (
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                                   <CardTitle className="flex items-center text-slate-200">
                   <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-cyan-400" />
                   Order Information - Order #{selectedOrderRef}
                 </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3 text-slate-400">Loading order data...</span>
                    </div>
                  ) : orderData.length > 0 ? (
                    <div className="space-y-4">
                      {orderData.map((order, index) => (
                        <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-slate-400">Product Code:</span>
                              <span className="text-cyan-300 font-mono ml-2">{order.product_code}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Product Qty:</span>
                              <span className="text-yellow-300 font-medium ml-2">{order.product_qty}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Loaded Qty:</span>
                              <span className="text-green-300 font-medium ml-2">{order.loaded_qty}</span>
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-slate-400">Product Description:</span>
                              <span className="text-white ml-2">{order.product_desc}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                                          <div className="text-center py-8 text-slate-400">
                        No order data found
                      </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Search Card */}
            {selectedOrderRef && (
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-200">
                    <MagnifyingGlassIcon className="h-6 w-6 mr-2 text-purple-400" />
                    Scan As You Load
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UnifiedSearch
                    ref={searchInputRef}
                    searchType="pallet"
                    onSelect={handleSearchSelect}
                    placeholder="Search Pallet number or Series..."
                    enableAutoDetection={true}
                    value={searchValue}
                    onChange={setSearchValue}
                    isLoading={isSearching}
                    disabled={isSearching}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 