'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase'; // Assuming supabase client is here
import { format } from 'date-fns'; // For date formatting
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { Button } from '../../components/ui/button';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { QrScanner } from '../../components/qr-scanner/qr-scanner';
import { Input } from '../../components/ui/input'; // Assuming Input is used, not seen in screenshot

// Helper to get user from localStorage
const getUserId = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        return userData.id || null;
      } catch (e) {
        console.error("Error parsing user data from localStorage", e); // Keep for dev debug
        toast.error('User session data is corrupted.');
        return null;
      }
    }
  }
  return null;
};

export default function StockTransferPage() {
  const [seriesInput, setSeriesInput] = useState('');
  const [palletNumInput, setPalletNumInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  interface ActivityLogEntry {
    message: string;
    type: 'success' | 'error' | 'info'; // 'info' 可以用於一般提示
  }

  const [foundPallet, setFoundPallet] = useState<{
    plt_num: string;
    product_code: string;
    product_qty: number;
  } | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [lastActiveInput, setLastActiveInput] = useState<'series' | 'pallet_num' | null>('series'); // 默認第一個欄位

  // Refs for input elements
  const seriesInputRef = useRef<HTMLInputElement>(null);
  const palletNumInputRef = useRef<HTMLInputElement>(null);

  const [showQrScannerModal, setShowQrScannerModal] = useState(false);

  // 行動裝置判斷
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  const resetState = () => {
    setSeriesInput('');
    setPalletNumInput('');
    setFoundPallet(null);
    // setActivityLog([]); //不再清除 activityLog，使其成為儲存式
    // Focus logic will be handled by useEffect based on lastActiveInput
  };

  const logHistory = async (action: string, plt_num_val: string | null, loc_val: string | null, remark_val: string | null) => {
    const userId = getUserId();
    if (!userId) {
      // console.error("User ID not found for history logging"); // Already handled by getUserId toast
      // toast.error('User session error. Cannot log history.'); // Avoid double toast if getUserId fails
      return;
    }
    try {
      const { error } = await supabase.from('record_history').insert({
        time: new Date().toISOString(),
        id: userId,
        action: action,
        plt_num: plt_num_val,
        loc: loc_val,
        remark: remark_val,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error logging history:', error); // Keep for dev debug
      toast.error(`Failed to log history: ${error.message}`);
    }
  };
  
  const handleSearch = async (searchType: 'series' | 'pallet_num', searchValue: string) => {
    if (!searchValue.trim()) {
      toast.info('Please enter a value to search.');
      return;
    }

    setIsLoading(true);
    setFoundPallet(null);
    let palletData = null;
    let errorOccurred = false;
    let searchedValueDisplay = searchValue;
    const formattedTime = format(new Date(), 'dd-MMM-yyyy HH:mm:ss');

    try {
      let query = supabase.from('record_palletinfo').select('plt_num, product_code, product_qty');
      if (searchType === 'series') {
        query = query.eq('series', searchValue);
      } else {
        query = query.eq('plt_num', searchValue);
      }
      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') throw error;
      palletData = data;

      if (palletData) {
        setFoundPallet(palletData);
        await fetchLatestLocation(palletData.plt_num, palletData.product_code, palletData.product_qty);
      } else {
        const palletNotFoundMsg = `Pallet ${searchType === 'series' ? 'Series' : 'Number'} : ${searchedValueDisplay} Not Found.`;
        toast.error(`${palletNotFoundMsg} (${formattedTime})`);
        await logHistory("Stock Move Fail", searchedValueDisplay, null, `Pallet Not Found`);
        errorOccurred = true;
      }
    } catch (error: any) {
      console.error('Error searching pallet:', error); // Keep for dev debug
      const searchErrorMsg = `Error searching pallet ${searchedValueDisplay}: ${error.message}`;
      toast.error(`${searchErrorMsg} (${formattedTime})`);
      await logHistory("Stock Move Fail", searchedValueDisplay, null, `Search Error: ${error.message}`);
      errorOccurred = true;
    } finally {
      setIsLoading(false);
      if (errorOccurred) {
        if (searchType === 'series') setSeriesInput(''); else setPalletNumInput('');
      }
      // Auto-focus logic handled by useEffect
    }
  };

  const fetchLatestLocation = async (pltNum: string, productCode: string, productQty: number) => {
    setIsLoading(true);
    const formattedTime = format(new Date(), 'dd-MMM-yyyy HH:mm:ss');
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('record_history')
        .select('loc')
        .eq('plt_num', pltNum)
        .order('time', { ascending: false })
        .limit(1)
        .single();

      if (historyError && historyError.code !== 'PGRST116') throw historyError; // PGRST116: no rows found

      const currentLocation = historyData?.loc || 'Unknown'; // Default to 'Unknown' if no history

      // Proceed to process stock movement
      await processStockMovement(pltNum, productCode, productQty, currentLocation);

    } catch (error: any) {
      console.error('Error fetching latest location:', error); // Keep for dev debug
      const fetchLocErrorMsg = `Error fetching location for ${pltNum}: ${error.message}`;
      toast.error(`${fetchLocErrorMsg} (${formattedTime})`);
      await logHistory("Stock Move Fail", pltNum, null, `Fetch Location Error: ${error.message}`);
      resetState();
    } finally {
      // setIsLoading(false); // processStockMovement will set it
    }
  };

  const processStockMovement = async (
    pltNum: string, 
    productCode: string, 
    productQty: number, 
    currentLocation: string | null
  ) => {
    setIsLoading(true);
    const userId = getUserId();
    if (!userId) {
      toast.error(`User ID not found. Cannot process movement for pallet ${pltNum}.`);
      setIsLoading(false);
      return;
    }
    const currentTime = new Date();
    const formattedTime = format(currentTime, 'dd-MMM-yyyy HH:mm:ss');
    const isoTime = currentTime.toISOString();

    try {
      let activityLogMessage = ''; // 用於替換 successMessage
      let newLoc = null; // This will be the TARGET location
      let historyAction = "Stock Transfer"; 
      let historyRemark = '';

      if (currentLocation === 'Awaiting') {
        if (productCode.startsWith('Z')) {
          newLoc = 'Production';
          historyRemark = 'Awaiting > Production';
          console.log('[Stock Transfer] Calling RPC update_inventory_stock_transfer for Awaiting (Z type) > Production with params:');
          console.log({ p_product_code: productCode, p_qty_change: productQty, p_from_col: 'await', p_to_col: 'injection', p_latest_update: isoTime });
          const { data: invDataZA, error: invErrorZA } = await supabase
            .rpc('update_inventory_stock_transfer', {
              p_product_code: productCode,
              p_qty_change: productQty,
              p_from_col: 'await',
              p_to_col: 'injection',
              p_latest_update: isoTime
            });
          console.log('[Stock Transfer] RPC Awaiting (Z type) > Production invData:', invDataZA);
          console.log('[Stock Transfer] RPC Awaiting (Z type) > Production invError:', invErrorZA);
          if (invErrorZA) throw new Error(`Inventory update (Awaiting Z > Prod): ${invErrorZA.message}`);
          if (invDataZA && invDataZA.status === 'error') {
            throw new Error(`Inventory update (Awaiting Z > Prod): ${invDataZA.message}`);
          }
          if (invDataZA && invDataZA.status !== 'success') {
            throw new Error(`Inventory update (Awaiting Z > Prod) returned: ${invDataZA.message || 'Unknown RPC non-success status'}`);
          }
          activityLogMessage = `Pallet : ${pltNum}  -  Accepted  -  ${formattedTime}`;
        } else {
          newLoc = 'Fold Mill'; 
          historyRemark = 'Awaiting > Fold Mill';
          console.log('[Stock Transfer] Calling RPC update_inventory_stock_transfer for Awaiting (non-Z) > Fold Mill with params:');
          console.log({ p_product_code: productCode, p_qty_change: productQty, p_from_col: 'await', p_to_col: 'fold', p_latest_update: isoTime });
          const { data: invDataAF, error: invErrorAF } = await supabase
            .rpc('update_inventory_stock_transfer', {
              p_product_code: productCode,
              p_qty_change: productQty,
              p_from_col: 'await', 
              p_to_col: 'fold',     
              p_latest_update: isoTime
            });
          console.log('[Stock Transfer] RPC Awaiting (non-Z) > Fold Mill invData:', invDataAF);
          console.log('[Stock Transfer] RPC Awaiting (non-Z) > Fold Mill invError:', invErrorAF);
          if (invErrorAF) throw new Error(`Inventory update (Awaiting non-Z > Fold): ${invErrorAF.message}`);
          if (invDataAF && invDataAF.status === 'error') {
            throw new Error(`Inventory update (Awaiting non-Z > Fold): ${invDataAF.message}`);
          }
          if (invDataAF && invDataAF.status !== 'success') {
            throw new Error(`Inventory update (Awaiting non-Z > Fold) returned: ${invDataAF.message || 'Unknown RPC non-success status'}`);
          }
          activityLogMessage = `Pallet : ${pltNum}  -  Accepted  -  ${formattedTime}`;
        }
      } else if (currentLocation === 'Fold Mill') {
        newLoc = 'Production'; // Target location
        historyRemark = 'Fold Mill > Production';
        // Update record_inventory (RPC call)
        console.log('[Stock Transfer] Calling RPC update_inventory_stock_transfer for Fold > Prod with params:');
        console.log({ p_product_code: productCode, p_qty_change: productQty, p_from_col: 'fold', p_to_col: 'injection', p_latest_update: isoTime });
        const { data: invDataF, error: invErrorF } = await supabase
          .rpc('update_inventory_stock_transfer', {
            p_product_code: productCode,
            p_qty_change: productQty,
            p_from_col: 'fold', 
            p_to_col: 'injection', 
            p_latest_update: isoTime
          });
        console.log('[Stock Transfer] RPC Fold > Prod invData:', invDataF);
        console.log('[Stock Transfer] RPC Fold > Prod invError:', invErrorF);
        if (invErrorF) throw new Error(`Inventory update (Fold > Prod): ${invErrorF.message}`);
        if (invDataF && invDataF.status === 'error') {
          throw new Error(`Inventory update (Fold > Prod): ${invDataF.message}`);
        }
        if (invDataF && invDataF.status !== 'success') {
            throw new Error(`Inventory update (Fold > Prod) returned: ${invDataF.message || 'Unknown RPC non-success status'}`);
       }
        activityLogMessage = `Pallet : ${pltNum}  -  Accepted  -  ${formattedTime}`;

      } else if (currentLocation === 'Voided') {
        historyAction = 'Scan Voided Pallet';
        newLoc = null; // No new location for void scan
        historyRemark = ''; 
        const voidMsg = `Pallet : ${pltNum} Is A Voided Pallet. Please Check Again - ${formattedTime}`;
        const newEntry: ActivityLogEntry = { message: voidMsg, type: 'error' };
        setActivityLog(prevLog => [newEntry, ...prevLog].slice(0, 50));
        
         const { error: historyInsertError } = await supabase.from('record_history').insert({
          time: isoTime,
          id: userId,
          action: historyAction,
          plt_num: pltNum,
          loc: null,
          remark: `Scanned voided pallet. Current reported loc: ${currentLocation}`,
        });
        if (historyInsertError) {
            console.error("Error logging void scan: ", historyInsertError.message);
            const voidLogErrorMsg = `Failed to log void pallet scan for ${pltNum} - ${format(new Date(), 'dd-MMM-yyyy HH:mm:ss')}`;
            const errorEntry: ActivityLogEntry = { message: voidLogErrorMsg, type: 'error' };
            setActivityLog(prevLog => [errorEntry, ...prevLog].slice(0, 50));
        }
        resetState(); // Keep resetState here for Void to clear inputs.
        setIsLoading(false);
        return; 

      } else if (currentLocation === null) {
        const noHistoryMsg = `Pallet : ${pltNum} Not Exist. Please Check Again - ${formattedTime}`; // Assuming no history means not exist for this user flow.
        const newEntry: ActivityLogEntry = { message: noHistoryMsg, type: 'error' };
        setActivityLog(prevLog => [newEntry, ...prevLog].slice(0, 50));
        await logHistory("Stock Move Fail", pltNum, null, "No prior location history");
        resetState(); 
        setIsLoading(false);
        return;

      } else { 
        const unhandledLocMsg = `Pallet : ${pltNum} at unhandled location "${currentLocation}". Transfer not applicable - ${formattedTime}`;
        const newEntry: ActivityLogEntry = { message: unhandledLocMsg, type: 'error' };
        setActivityLog(prevLog => [newEntry, ...prevLog].slice(0, 50));
        await logHistory("Scan Failure", pltNum, currentLocation, `Scan at unhandled location for transfer: ${currentLocation}`);
        resetState();
        setIsLoading(false);
        return;
      }

      if (newLoc) { 
        const { error: historyInsertError } = await supabase.from('record_history').insert({
          time: isoTime,
          id: userId,
          action: historyAction, 
          plt_num: pltNum,
          loc: newLoc, 
          remark: historyRemark,
        });

        if (historyInsertError) {
          console.error(`CRITICAL: Inventory for ${pltNum} updated, but failed to log history to ${newLoc}: ${historyInsertError.message}`);
          const criticalHistoryErrorMsg = `CRITICAL: History log failed for ${pltNum} to ${newLoc} (Inventory WAS updated) - ${format(new Date(), 'dd-MMM-yyyy HH:mm:ss')}`;
          const errorEntry: ActivityLogEntry = { message: criticalHistoryErrorMsg, type: 'error' };
          setActivityLog(prevLog => [errorEntry, ...prevLog].slice(0, 50));
        } else {
          const successEntry: ActivityLogEntry = { message: activityLogMessage, type: 'success' };
          setActivityLog(prevLog => [successEntry, ...prevLog].slice(0, 50)); 
        }
        resetState(); 
      }
    
    } catch (error: any) {
      console.error('Error processing stock movement:', error);
      const processingErrorMsg = `Movement processing error for ${pltNum}: ${error.message} - ${format(new Date(), 'dd-MMM-yyyy HH:mm:ss')}`;
      const errorEntry: ActivityLogEntry = { message: processingErrorMsg, type: 'error' };
      setActivityLog(prevLog => [errorEntry, ...prevLog].slice(0, 50));
      await logHistory("Stock Move Fail", pltNum, currentLocation, `Processing Error: ${error.message}`);
      resetState(); 
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect for focusing input
  useEffect(() => {
    if (!isLoading) {
      if (lastActiveInput === 'series' && seriesInputRef.current) {
        seriesInputRef.current.focus();
      } else if (lastActiveInput === 'pallet_num' && palletNumInputRef.current) {
        palletNumInputRef.current.focus();
      }
    }
  }, [isLoading, lastActiveInput, foundPallet]); // Re-focus when foundPallet changes (likely after a search)

  const handleSeriesScanFromModal = (scannedValue: string) => {
    if (scannedValue) {
      setSeriesInput(scannedValue);
      handleSearch('series', scannedValue);
      setLastActiveInput('pallet_num');
    }
    setShowQrScannerModal(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, inputType: 'series' | 'pallet_num') => {
    if (e.key === 'Enter') {
      if (inputType === 'series') {
        handleSearch('series', seriesInput);
        setLastActiveInput('pallet_num');
      } else {
        handleSearch('pallet_num', palletNumInput);
        setLastActiveInput('series');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
      <div className="w-full max-w-4xl p-2 rounded-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">Stock Movement</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label htmlFor="seriesInputDisplay" className="block text-sm font-medium">QR Code / Series</label>
            <div className="flex items-center space-x-2">
                <Input
                    ref={seriesInputRef}
                    id="seriesInputDisplay"
                    type="text"
                    value={seriesInput}
                    onChange={(e) => setSeriesInput(e.target.value)}
                    onKeyDown={(e) => handleInputKeyDown(e, 'series')}
                    onClick={() => setLastActiveInput('series')}
                    placeholder="Input Series or Scan QR"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 transition"
                    disabled={isLoading}
                />
                <Button
                    type="button"
                    onClick={() => setShowQrScannerModal(true)}
                    disabled={isLoading}
                    className="p-3 bg-orange-600 hover:bg-orange-700 h-full whitespace-nowrap"
                >
                    Scan
                </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="palletNumInputDisplay" className="block text-sm font-medium">Pallet Number</label>
            <Input
              ref={palletNumInputRef}
              id="palletNumInputDisplay"
              type="text"
              value={palletNumInput}
              onChange={(e) => setPalletNumInput(e.target.value)}
              onKeyDown={(e) => handleInputKeyDown(e, 'pallet_num')}
              onClick={() => setLastActiveInput('pallet_num')}
              placeholder="Input Pallet Number To Search"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 transition"
              disabled={isLoading}
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500"></div>
            <p className="ml-4 text-lg">Processing...</p>
          </div>
        )}

        {activityLog.length > 0 && (
          <div className="mt-8 w-full bg-gray-800 shadow-xl rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Activity Log:</h2>
            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 ">
              {activityLog.map((log, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-md text-sm ${log.type === 'success' ? 'bg-green-700/50 text-green-300' : log.type === 'error' ? 'bg-red-800/60 text-red-300' : 'bg-blue-700/50 text-blue-300'}`}>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal QrScanner */}
        <QrScanner
            open={showQrScannerModal}
            onClose={() => setShowQrScannerModal(false)}
            onScan={handleSeriesScanFromModal} 
            title="Scan Pallet QR Code"
            hint="Align QR code to scan for stock movement"
        />

      </div>
    </div>
  );
} 