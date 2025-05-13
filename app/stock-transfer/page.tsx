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
        // ** NEW LOGIC: If pallet is already at Fold Mill, stop further processing **
        const foldMillStopMsg = `Pallet ${pltNum} is already at Fold Mill. Transfer not processed. - ${formattedTime}`;
        const newEntry: ActivityLogEntry = { message: foldMillStopMsg, type: 'info' }; 
        setActivityLog(prevLog => [newEntry, ...prevLog].slice(0, 50));
        await logHistory("Transfer Blocked", pltNum, currentLocation, "Pallet at Fold Mill, transfer stopped by rule.");
        resetState();
        setIsLoading(false);
        return; 
        // ** END OF NEW LOGIC FOR Fold Mill **
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
        await logHistory("Stock Move Fail", pltNum, null, "No Prior Location History");
        resetState(); 
        setIsLoading(false);
        return;

      } else { 
        const unhandledLocMsg = `Pallet : ${pltNum} Invalid location "${currentLocation}" [Second Transaction]. Transfer Not Processed. - ${formattedTime}`;
        const newEntry: ActivityLogEntry = { message: unhandledLocMsg, type: 'error' };
        setActivityLog(prevLog => [newEntry, ...prevLog].slice(0, 50));
        await logHistory("Scan Failure", pltNum, currentLocation, `Unhandled Location : ${currentLocation}`);
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
          // Even if history log fails, attempt to log to record_transfer if it's a critical part of the process
          // Or decide if this error should prevent record_transfer logging too.
          // For now, we will proceed to attempt record_transfer logging.
        } else {
          // Only add to success activity log if history was successful
          const successEntry: ActivityLogEntry = { message: activityLogMessage, type: 'success' };
          setActivityLog(prevLog => [successEntry, ...prevLog].slice(0, 50)); 
        }

        // **** ADD LOGIC TO INSERT INTO record_transfer HERE ****
        const formattedTransferDate = format(currentTime, 'dd-MMM-yyyy HH:mm:ss');
        const transferRecord = {
          tran_date: formattedTransferDate, // Use the formatted time string
          operator_id: userId,
          plt_num: pltNum,
          f_loc: currentLocation, // Current location before transfer
          t_loc: newLoc,          // Target location after transfer
        };

        console.log('[Stock Transfer] Attempting to insert into record_transfer:', transferRecord);
        const { error: transferInsertError } = await supabase.from('record_transfer').insert(transferRecord);

        if (transferInsertError) {
          console.error(`Error inserting into record_transfer for ${pltNum}: ${transferInsertError.message}`);
          const transferLogErrorMsg = `Failed to log to Transfer Record for ${pltNum} (${currentLocation} > ${newLoc}) - ${format(new Date(), 'dd-MMM-yyyy HH:mm:ss')}`;
          // Add to activity log as an error, but don't overwrite a success message if history was logged successfully
          const errorEntry: ActivityLogEntry = { message: transferLogErrorMsg, type: 'error' };
          setActivityLog(prevLog => [errorEntry, ...prevLog].slice(0, 50));
          toast.error(`Failed to create transfer record: ${transferInsertError.message}`);
        } else {
          console.log(`[Stock Transfer] Successfully inserted into record_transfer for ${pltNum}`);
          // Optionally, add a specific success message for record_transfer if needed, or rely on the main activityLogMessage
        }
        // **** END OF record_transfer LOGIC ****

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

  // Auto-focus logic
  useEffect(() => {
    if (lastActiveInput === 'series' && seriesInputRef.current) {
      seriesInputRef.current.focus();
    } else if (lastActiveInput === 'pallet_num' && palletNumInputRef.current) {
      palletNumInputRef.current.focus();
    }
  }, [lastActiveInput, seriesInput, palletNumInput]); // Re-run if these change to re-apply focus

  const handleSeriesScanFromModal = (scannedValue: string) => {
    setSeriesInput(scannedValue);
    setLastActiveInput('series'); // Set last active input to series
    // Automatically trigger search after scan
    if (scannedValue.trim()) {
      handleSearch('series', scannedValue.trim());
    }
    setShowQrScannerModal(false); // Close modal after scan
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, inputType: 'series' | 'pallet_num') => {
    if (e.key === 'Enter') {
      if (inputType === 'series' && seriesInput.trim()) {
        handleSearch('series', seriesInput.trim());
      } else if (inputType === 'pallet_num' && palletNumInput.trim()) {
        handleSearch('pallet_num', palletNumInput.trim());
      }
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4 pt-16 md:pt-24">
      <div className="w-full max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold text-center text-orange-500 mb-10">Stock Movement</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 items-start">
          <div className="space-y-2">
            <label htmlFor="seriesInput" className="block text-lg font-medium text-gray-300">QR Code / Series</label>
            <Input
              id="seriesInput"
              ref={seriesInputRef}
              type="text"
              placeholder={isMobile ? "Tap To Scan QR Code" : "Scan QR"}
              value={seriesInput}
              onChange={(e) => setSeriesInput(e.target.value)}
              onKeyDown={(e) => handleInputKeyDown(e, 'series')}
              onClick={() => {
                if (isMobile) {
                  setShowQrScannerModal(true); 
                }
                setLastActiveInput('series');
              }}
              className="bg-gray-800 border-gray-700 placeholder-gray-400 text-lg p-3 w-full rounded-md focus:ring-orange-500 focus:border-orange-500"
              readOnly={isMobile && !showQrScannerModal}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="palletNumInput" className="block text-lg font-medium text-gray-300">Pallet Number</label>
            <Input
              id="palletNumInput"
              ref={palletNumInputRef}
              type="text"
              placeholder="Input Pallet Number To Search"
              value={palletNumInput}
              onChange={(e) => setPalletNumInput(e.target.value)}
              onKeyDown={(e) => handleInputKeyDown(e, 'pallet_num')}
              onClick={() => setLastActiveInput('pallet_num')}
              className="bg-gray-800 border-gray-700 placeholder-gray-400 text-lg p-3 w-full rounded-md focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        
        {activityLog.length > 0 && (
          <div className="mt-8 w-full bg-gray-800 p-4 rounded-lg shadow max-h-96 overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-200 mb-3">Activity Log</h2>
            <ul className="space-y-2">
              {activityLog.map((log, index) => (
                <li 
                  key={index} 
                  className={`text-3xl p-4 rounded-md ${
                    log.type === 'success' ? 'bg-green-700 text-green-100' : 
                    log.type === 'error' ? 'bg-red-700 text-red-100' : 
                    'bg-blue-700 text-blue-100' // Default for 'info'
                  }`}
                >
                  {log.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {showQrScannerModal && (
        <QrScanner
          open={showQrScannerModal}
          onClose={() => setShowQrScannerModal(false)}
          onScan={handleSeriesScanFromModal}
          title="Scan Pallet Series QR Code"
          hint="Align QR code within the frame"
        />
      )}
      <Toaster richColors position="top-center" />
    </div>
  );
} 