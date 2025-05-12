'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase'; // Assuming supabase client is here
import { format } from 'date-fns'; // For date formatting
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { Button } from '../../components/ui/button';
import { BrowserMultiFormatReader } from '@zxing/browser';

// Helper to get user from localStorage
const getUserId = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        return userData.id || null;
      } catch (e) {
        console.error("Error parsing user data from localStorage", e);
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

  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);

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
      console.error("User ID not found for history logging");
      toast.error('User session error. Cannot log history.');
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
    } catch (error) {
      console.error('Error logging history:', error);
      toast.error('Failed to log history.');
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

    try {
      if (searchType === 'series') {
        const { data, error } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty')
          .eq('series', searchValue)
          .single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows found
        palletData = data;
      } else { // pallet_num
        const { data, error } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty')
          .eq('plt_num', searchValue)
          .single(); // Assuming plt_num is unique enough for single(), or handle multiple if needed
        if (error && error.code !== 'PGRST116') throw error;
        palletData = data;
        // If searching by pallet_num, the display value for errors is already searchValue (which is the plt_num)
      }

      if (palletData) {
        setFoundPallet(palletData);
        await fetchLatestLocation(palletData.plt_num, palletData.product_code, palletData.product_qty);
      } else {
        const palletNotFoundMsg = `Pallet : ${searchedValueDisplay} Not Exist. Please Check Again - ${format(new Date(), 'dd-MMM-yyyy HH:mm:ss')}`;
        const newEntry: ActivityLogEntry = { message: palletNotFoundMsg, type: 'error' };
        setActivityLog(prevLog => [newEntry, ...prevLog].slice(0, 50));
        await logHistory("Stock Move Fail", searchedValueDisplay, null, `Pallet Not Found`);
        errorOccurred = true;
      }
    } catch (error: any) {
      console.error('Error searching pallet:', error);
      const searchErrorMsg = `Error searching pallet ${searchedValueDisplay}: ${error.message} - ${format(new Date(), 'dd-MMM-yyyy HH:mm:ss')}`;
      const newEntry: ActivityLogEntry = { message: searchErrorMsg, type: 'error' };
      setActivityLog(prevLog => [newEntry, ...prevLog].slice(0, 50)); 
      await logHistory("Stock Move Fail", searchedValueDisplay, null, `Search Error: ${error.message}`);
      errorOccurred = true;
    } finally {
      setIsLoading(false);
      if (errorOccurred) {
        if (searchType === 'series') setSeriesInput(''); else setPalletNumInput('');
      }
    }
  };

  const fetchLatestLocation = async (pltNum: string, productCode: string, productQty: number) => {
    setIsLoading(true);
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('record_history')
        .select('loc')
        .eq('plt_num', pltNum)
        .order('time', { ascending: false })
        .limit(1)
        .single();

      if (historyError && historyError.code !== 'PGRST116') throw historyError; // PGRST116: no rows found

      const currentLocation = historyData?.loc || null; // If no history, loc is null

      // Proceed to process stock movement
      await processStockMovement(pltNum, productCode, productQty, currentLocation);

    } catch (error: any) {
      console.error('Error fetching latest location:', error);
      const fetchLocErrorMsg = `Error fetching location for ${pltNum}: ${error.message} - ${format(new Date(), 'dd-MMM-yyyy HH:mm:ss')}`;
      const newEntry: ActivityLogEntry = { message: fetchLocErrorMsg, type: 'error' };
      setActivityLog(prevLog => [newEntry, ...prevLog].slice(0, 50));
      await logHistory("Stock Move Fail", pltNum, null, `Fetch Location Error: ${error.message}`);
      setIsLoading(false);
      setSeriesInput('');
      setPalletNumInput('');
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
      const userIdErrorMsg = `User ID not found. Cannot process movement. - ${format(new Date(), 'dd-MMM-yyyy HH:mm:ss')}`;
      const newEntry: ActivityLogEntry = { message: userIdErrorMsg, type: 'error' };
      setActivityLog(prevLog => [newEntry, ...prevLog].slice(0, 50));
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

      } else if (currentLocation === 'Void') {
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

  // 啟動掃描器
  const handleStartScan = async () => {
    setShowScanner(true);
    setTimeout(() => startScanner(), 100); // 等待 video 元素渲染
  };

  // 啟動 @zxing/browser 掃描
  const startScanner = async () => {
    if (!videoRef.current) return;
    if (scannerRef.current) {
      scannerRef.current.stopContinuousDecode();
    }
    const codeReader = new BrowserMultiFormatReader();
    scannerRef.current = codeReader;
    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const deviceId = devices[0]?.deviceId;
      if (!deviceId) throw new Error('No camera found');
      codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (result) {
          setShowScanner(false);
          codeReader.stopContinuousDecode();
          setSeriesInput(result.getText());
          setLastActiveInput('series');
          handleSearch('series', result.getText());
        }
      });
    } catch (err) {
      setShowScanner(false);
      if (scannerRef.current) {
        scannerRef.current.stopContinuousDecode();
      }
      toast.error('Camera not available or permission denied.');
    }
  };

  // 關閉掃描器
  const handleCloseScan = () => {
    setShowScanner(false);
    if (scannerRef.current) {
      scannerRef.current.stopContinuousDecode();
    }
  };

  // Handle Enter key press for inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, inputType: 'series' | 'pallet_num') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isLoading) return;
      
      // Set last active input before handling search
      setLastActiveInput(inputType);

      if (inputType === 'series' && seriesInput.trim()) {
        // Attempt to determine if it's a series or plt_num based on format/length
        // For now, let's assume series input can be EITHER series or plt_num if palletNumInput is empty
        // This logic needs refinement. A robust way is to check series format.
        // Example: Series '25051100-VZZROG' (15 chars, includes '-')
        // Pallet Num '110525/11' (9 chars, includes '/')
        const isLikelySeries = seriesInput.includes('-') && seriesInput.length > 10; // Basic heuristic
        if (isLikelySeries) {
            handleSearch('series', seriesInput.trim());
        } else {
            // If it doesn't look like a series, treat as pallet number
            handleSearch('pallet_num', seriesInput.trim());
        }
      } else if (inputType === 'pallet_num' && palletNumInput.trim()) {
        handleSearch('pallet_num', palletNumInput.trim());
      }
    }
  };
  
  useEffect(() => {
    // Focus on the last active input when loading stops and there's an activity log update
    // (indicating an operation just finished)
    if (!isLoading && activityLog.length > 0) {
      if (lastActiveInput === 'series' && seriesInputRef.current) {
        seriesInputRef.current.focus();
      } else if (lastActiveInput === 'pallet_num' && palletNumInputRef.current) {
        palletNumInputRef.current.focus();
      }
    }
    // We only want this effect to run when isLoading changes or activityLog gets a new entry.
    // Adding lastActiveInput to dependencies could cause re-focus on other state changes.
  }, [isLoading, activityLog]);

  return (
    <div className="pl-12 pt-16 min-h-screen bg-[#232532] text-white">
      <Toaster richColors position="top-right" />
      <div className="flex flex-col w-full max-w-6xl ml-0 px-0">
        <div className="flex items-center mb-12 mt-2">
          <h1 className="text-3xl font-bold text-orange-400" style={{letterSpacing: 1}}>Stock Movement</h1>
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-12 w-full">
            <div className="flex items-center w-full sm:w-1/2 max-w-xl">
              <label htmlFor="series" className="text-lg font-semibold mr-4 min-w-[90px] text-right">QR Code</label>
              <input
                id="series"
                type="text"
                value={seriesInput}
                onChange={(e) => {
                  setSeriesInput(e.target.value);
                  if (palletNumInput) setPalletNumInput(''); 
                  setLastActiveInput('series');
                }}
                onKeyDown={(e) => handleKeyDown(e, 'series')}
                placeholder="Scan QR Code To Search"
                className="flex-1 px-4 py-3 rounded-md bg-gray-900 border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-white"
                disabled={isLoading}
                ref={seriesInputRef}
              />
              {isMobile && (
                <Button
                  type="button"
                  variant="secondary"
                  className="ml-2 px-3 py-2 text-xs"
                  onClick={handleStartScan}
                  disabled={isLoading}
                >
                  Scan QR
                </Button>
              )}
            </div>
            
            <div className="flex items-center w-full sm:w-1/2 max-w-xl mt-4 sm:mt-0">
              <label htmlFor="palletNum" className="text-lg font-semibold mr-4 min-w-[130px] text-right">Pallet Number</label>
              <input
                id="palletNum"
                type="text"
                value={palletNumInput}
                onChange={(e) => {
                  setPalletNumInput(e.target.value);
                  if (seriesInput) setSeriesInput(''); 
                  setLastActiveInput('pallet_num');
                }}
                onKeyDown={(e) => handleKeyDown(e, 'pallet_num')}
                placeholder="Input Pallet Number To Search"
                className="flex-1 px-4 py-3 rounded-md bg-gray-900 border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-white"
                disabled={isLoading}
                ref={palletNumInputRef}
              />
            </div>
          </div>

          {foundPallet && (
            <div className="mt-6 p-4 bg-gray-800 rounded-md">
              <h3 className="text-xl font-semibold text-orange-300 mb-2">Pallet Information</h3>
              <p><strong>Pallet Number:</strong> {foundPallet.plt_num}</p>
              <p><strong>Product Code:</strong> {foundPallet.product_code}</p>
              <p><strong>Quantity:</strong> {foundPallet.product_qty}</p>
              { /* Add current location display here if fetched and available in foundPallet or another state */ }
            </div>
          )}

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
              <p className="mt-2 text-orange-300">Processing...</p>
            </div>
          )}

          {showScanner && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
              <div className="bg-gray-900 rounded-lg p-4 flex flex-col items-center">
                <video ref={videoRef} className="w-[320px] h-[240px] bg-black rounded" autoPlay muted playsInline />
                <Button className="mt-4" variant="destructive" onClick={handleCloseScan}>Close</Button>
              </div>
            </div>
          )}

          {/* Activity Log Display */}
          {activityLog.length > 0 && (
            <div className="mt-6 p-4 bg-gray-700 rounded-md text-base md:text-4xl">
              <h3 className="text-lg font-semibold text-orange-300 mb-3">Activity Log:</h3>
              <ul className="space-y-1">
                {activityLog.map((logEntry, index) => (
                  <li key={index} 
                      className={`
                        ${logEntry.type === 'success' ? 'text-yellow-400' : 'text-red-400'}
                      `}>
                      {`> ${logEntry.message}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 