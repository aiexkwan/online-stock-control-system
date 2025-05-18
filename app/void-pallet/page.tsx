'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase'; // Assuming supabase client is here
import { format } from 'date-fns'; // For date formatting
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input'; // Import Input
import { QrScanner } from '../../components/qr-scanner/qr-scanner'; // Modal QrScanner
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../../components/ui/dialog'; // Import Dialog components
import { Combobox } from '@/components/ui/combobox'; // Import Combobox
import { verifyCurrentUserPasswordAction } from '../../app/actions/authActions'; // For password verification
import { voidPalletAction, processDamagedPalletVoidAction } from './actions'; // Import server actions

interface FoundPalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  series?: string; // Made series optional
  plt_remark: string | null;
  original_plt_loc: string | null; // This is the plt_loc from record_palletinfo
}

// Explicitly type VOID_REASONS
const VOID_REASONS: { value: string; label: string; }[] = [
  { value: "Print Extra Label", label: "Print Extra Label" },
  { value: "Wrong Qty", label: "Wrong Qty" },
  { value: "Wrong Product Code", label: "Wrong Product Code" },
  { value: "Damage", label: "Damage" },
  { value: "Pallet Qty Changed", label: "Pallet Qty Changed" },
  { value: "Used Material", label: "Used Material" },
  { value: "Other", label: "Other (Specify if possible)" }, 
];

export default function VoidPalletPage() {
  const [seriesInput, setSeriesInput] = useState('');
  const [palletNumInput, setPalletNumInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundPallet, setFoundPallet] = useState<FoundPalletInfo | null>(null);
  const [lastActiveInput, setLastActiveInput] = useState<'series' | 'pallet_num' | null>('series');
  const [showScanner, setShowScanner] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isVoiding, setIsVoiding] = useState(false); // For voiding loading state
  const [userId, setUserId] = useState<string | null>(null);

  // New states for blocking toast and disabling input
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [blockingErrorToastId, setBlockingErrorToastId] = useState<string | number | null>(null);

  // New states for Damage Qty
  const [damageQtyInput, setDamageQtyInput] = useState('');
  const [showDamageQtyInput, setShowDamageQtyInput] = useState(false);
  const [isDamageQtyDisabledForAco, setIsDamageQtyDisabledForAco] = useState(false);

  // Refs for input elements
  const seriesInputRef = useRef<HTMLInputElement>(null);
  const palletNumInputRef = useRef<HTMLInputElement>(null);

  // 行動裝置判斷
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  const resetInputFields = () => {
    setSeriesInput('');
    setPalletNumInput('');
    // It's good practice to also reset damageQtyInput here if it's closely tied to search results
    // setDamageQtyInput(''); // Will be handled by resetState or specific logic for voidReason
  };

  const resetState = () => {
    resetInputFields();
    setFoundPallet(null);
    setVoidReason(''); // Clear void reason on reset
    setPasswordInput(''); // Clear password on reset
    setShowDamageQtyInput(false); // Hide damage qty input
    setDamageQtyInput(''); // Clear damage qty input
    // Do not reset isInputDisabled or blockingErrorToastId here unless specifically intended
  };

  // Effect to handle Damage Qty input visibility and ACO Ref logic
  useEffect(() => {
    if (voidReason === 'Damage') {
      setShowDamageQtyInput(true);
      if (foundPallet && foundPallet.plt_remark && /ACO Ref : \d{5,7}/.test(foundPallet.plt_remark)) {
        setDamageQtyInput(foundPallet.product_qty.toString());
        setIsDamageQtyDisabledForAco(true);
      } else {
        // If not ACO or no pallet found yet, but reason is Damage, ensure damageQtyInput is not locked by previous ACO pallet
        // and input is enabled
        // setDamageQtyInput(''); // Allow user to type; only clear if reason changes away from Damage
        setIsDamageQtyDisabledForAco(false);
      }
    } else {
      setShowDamageQtyInput(false);
      setDamageQtyInput(''); // Clear if reason is not Damage
      setIsDamageQtyDisabledForAco(false); // Ensure disabled state is also reset
    }
  }, [voidReason, foundPallet]);

  const logHistory = async (action: string, plt_num_val: string | null, loc_val: string | null, remark_val: string | null) => {
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

  // New function to log errors to the database
  const logErrorToDatabase = async (specificErrorInfo: string) => {
    if (!userId) {
      console.warn('Cannot log error to database: User ID is null.');
      // Optionally, show a non-blocking toast to inform user about logging issue
      // toast.info('Could not record error details due to missing user session.');
      return;
    }
    try {
      // Ensure userId is parsed to int for the database, handle potential NaN
      const userIdAsInt = parseInt(userId, 10);
      if (isNaN(userIdAsInt)) {
        console.warn('Cannot log error to database: User ID is not a valid number.', userId);
        // toast.info('Could not record error details due to invalid user ID format.');
        return;
      }

      const { error } = await supabase.from('report_log').insert({
        error: 'Void Pallet Error', // Specific error type for this page
        error_info: specificErrorInfo.substring(0, 255), // Ensure not too long for DB
        user_id: userIdAsInt,
        state: false, // Default to false as per table structure
        // uuid and time are auto-generated by the database
      });
      if (error) {
        console.error('Failed to log error to report_log table:', error);
        // toast.error('Failed to save error log to database.'); // Avoid toast loop if toast system has issues
      }
    } catch (e) {
      console.error('Exception while logging error to report_log:', e);
    }
  };

  const showErrorToastAndDisableInputs = (toastMessage: string, dbReportErrorInfo: string) => {
    logErrorToDatabase(dbReportErrorInfo); // Log to database first

    if (blockingErrorToastId) {
      toast.dismiss(blockingErrorToastId); 
    }
    const newToastId = toast.error(toastMessage, {
      duration: Infinity, // Persists until dismissed by handleConfirmError
      // Add a unique ID to prevent duplicate toasts if rapidly called, though dismiss should handle it.
      // id: `blocking-error-${Date.now()}` 
    });
    setBlockingErrorToastId(newToastId);
    setIsInputDisabled(true);
    setIsLoading(false); // Ensure other loading states are off
    setIsVoiding(false);
  };

  const handleConfirmError = () => {
    if (blockingErrorToastId !== null && blockingErrorToastId !== undefined) {
      toast.dismiss(blockingErrorToastId);
    }
    setBlockingErrorToastId(null);
    setIsInputDisabled(false);
    resetState(); // Reset form fields and found pallet info
    // Focus last active input or a default one
    if (lastActiveInput === 'series' && seriesInputRef.current) {
      seriesInputRef.current.focus();
    } else if (lastActiveInput === 'pallet_num' && palletNumInputRef.current) {
      palletNumInputRef.current.focus();
    } else if (seriesInputRef.current) { // Fallback to series input
      seriesInputRef.current.focus();
    }
  };

  const handleSearch = async (searchType: 'series' | 'pallet_num', searchValue: string) => {
    if (!searchValue.trim()) {
      toast.info('Please enter a value to search.');
      return;
    }

    setIsLoading(true);
    setFoundPallet(null);
    // Type for data directly fetched from record_palletinfo, matching the select structure
    let dbPalletData: {
        plt_num?: string; // Optional because it might come from input if searching by pallet_num
        product_code: string;
        product_qty: number;
        series_val?: string; // This is what we select as 'series' from the DB
        plt_remark: string | null;
        original_plt_loc: string | null; 
    } | null = null;
    let errorOccurred = false;
    let searchedValueDisplay = searchValue;
    // const formattedTime = format(new Date(), 'dd-MMM-yyyy HH:mm:ss'); // Not used directly here anymore

    try {
      if (searchType === 'series') {
        const { data, error } = await supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty, series_val:series, plt_remark, original_plt_loc:plt_loc') 
          .eq('series', searchValue.trim())
          .single();
        if (error && error.code !== 'PGRST116') throw error; 
        dbPalletData = data; // data directly matches the structure with series_val
      } else { // pallet_num
        const pltNumFromInput = searchValue.trim();
        const { data, error } = await supabase
          .from('record_palletinfo')
          // When searching by pallet_num, we don't fetch series, so series_val will be implicitly undefined
          .select('product_code, product_qty, plt_remark, original_plt_loc:plt_loc') 
          .eq('plt_num', pltNumFromInput)
          .single(); 
        if (error && error.code !== 'PGRST116') throw error;
        // Add plt_num from input; series_val is not in select, so it's fine
        dbPalletData = data ? { ...data, plt_num: pltNumFromInput } : null;
      }

      if (dbPalletData && dbPalletData.plt_num) { 
        const palletToSet: FoundPalletInfo = {
            plt_num: dbPalletData.plt_num, 
            product_code: dbPalletData.product_code,
            product_qty: dbPalletData.product_qty,
            series: dbPalletData.series_val, 
            plt_remark: dbPalletData.plt_remark,
            original_plt_loc: dbPalletData.original_plt_loc,
        };
        // setFoundPallet(palletToSet); // Defer setting found pallet until after checks

        if (palletToSet.original_plt_loc === 'Voided') {
            const errMsg = `Pallet ${palletToSet.plt_num} is already voided.`;
            const dbErrInfo = `Search result: Pallet ${palletToSet.plt_num} already voided. Loc: ${palletToSet.original_plt_loc}`;
            showErrorToastAndDisableInputs(errMsg, dbErrInfo);
            // resetInputFields(); // showErrorToastAndDisableInputs will call resetState via handleConfirmError if user clicks it
            // setFoundPallet(null);
            errorOccurred = true; // Ensure finally block doesn't try to use it
        } else {
            setFoundPallet(palletToSet); // Set pallet if not voided
            // toast.success(`Pallet ${palletToSet.plt_num} found.`); // Optional success feedback
        }
      } else {
        const errMsg = `Pallet Not Found (Input: ${searchedValueDisplay}).`;
        const dbErrInfo = `Pallet not found. Search type: ${searchType}, Value: ${searchedValueDisplay}`;
        showErrorToastAndDisableInputs(errMsg, dbErrInfo);
        // await logHistory("Void Pallet Search Fail", null, null, `Pallet Not Found (Input: ${searchedValueDisplay})`); // Done by showErrorToastAndDisableInputs
        errorOccurred = true;
      }
    } catch (error: any) {
      console.error('Error searching pallet:', error);
      const errMsg = `Error Searching Pallet: ${error.message || 'Unknown error'}`;
      const dbErrInfo = `Search Error: Type '${searchType}', Val '${searchedValueDisplay}', ${error.code || 'N/A'} - ${error.message ? error.message.substring(0,100) : 'Unknown'}`;
      showErrorToastAndDisableInputs(errMsg, dbErrInfo);
      // await logHistory("Void Pallet Search Fail", null, null, `Search Error (Input: ${searchedValueDisplay}, Error: ${error.message})`); // Done by showErrorToastAndDisableInputs
      errorOccurred = true;
    } finally {
      setIsLoading(false);
      // if (errorOccurred) { // This reset is now handled by handleConfirmError or if search is successful
        // resetInputFields();
      // }
    }
  };

  // Handle Enter key press for inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, inputType: 'series' | 'pallet_num') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isLoading || isVoiding || isInputDisabled) return; // Check isInputDisabled
      setLastActiveInput(inputType);
      if (inputType === 'series' && seriesInput.trim()) {
        handleSearch('series', seriesInput.trim());
      } else if (inputType === 'pallet_num' && palletNumInput.trim()) {
        handleSearch('pallet_num', palletNumInput.trim());
      }
    }
  };
  
  useEffect(() => {
    if (!isLoading && !isVoiding) {
      if (lastActiveInput === 'series' && seriesInputRef.current) {
        seriesInputRef.current.focus();
      } else if (lastActiveInput === 'pallet_num' && palletNumInputRef.current) {
        palletNumInputRef.current.focus();
      }
    }
  }, [isLoading, isVoiding, lastActiveInput, foundPallet]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clockNumber = localStorage.getItem('loggedInUserClockNumber');
      if (clockNumber) {
        setUserId(clockNumber);
      } else {
        console.warn('[VoidPalletPage] loggedInUserClockNumber not found in localStorage.');
        setUserId(null); // Or handle appropriately
      }
    }
  }, []);

  const handleSeriesScan = (scannedValue: string) => {
    setSeriesInput(scannedValue);
    setShowScanner(false);
    // Automatically trigger search after scan
    // Ensure seriesInputRef.current exists before trying to call focus or other methods
    if (seriesInputRef.current) {
      // Setting state is async, so pass scannedValue directly to handleSearch
      handleSearch('series', scannedValue);
    } else {
      // Fallback or error handling if ref is not available
      toast.error("Internal error: Series input reference not found.");
    }
  };
  
  // Main function to handle the voiding process
  const handleVoidConfirm = async () => {
    if (!foundPallet) {
      toast.error('No pallet selected to void.');
      return;
    }
    if (!voidReason.trim()) {
      toast.error('Please select or enter a void reason.');
      return;
    }
    if (!passwordInput) {
      toast.error('Please enter your password.');
      return;
    }
    if (!userId) {
      toast.error('User session not found. Please re-login.');
      // Log to db as this is a significant issue
      logErrorToDatabase(`Void attempt failed: User ID missing. Pallet: ${foundPallet.plt_num}`);
      return;
    }

    const userIdAsInt = parseInt(userId, 10);
    if (isNaN(userIdAsInt)) {
      toast.error('User ID is invalid. Please re-login.');
      logErrorToDatabase(`Void attempt failed: User ID invalid (${userId}). Pallet: ${foundPallet.plt_num}`);
      return;
    }

    setIsVoiding(true);
    let result;

    try {
      if (voidReason === 'Damage') {
        const damageQtyNum = parseInt(damageQtyInput, 10);

        if (isNaN(damageQtyNum)) {
          showErrorToastAndDisableInputs(
            'Invalid Damage Quantity: Not a number.',
            `Void Fail (DMG): Pallet ${foundPallet.plt_num}, Invalid Damage Qty (NaN): ${damageQtyInput}`
          );
          setIsVoiding(false);
          return;
        }

        if (damageQtyNum <= 0) {
            showErrorToastAndDisableInputs(
              'Invalid Damage Quantity: Must be greater than 0.',
              `Void Fail (DMG): Pallet ${foundPallet.plt_num}, Damage Qty <= 0: ${damageQtyNum}`
            );
            setIsVoiding(false);
            return;
        }
        
        if (!isDamageQtyDisabledForAco && damageQtyNum > foundPallet.product_qty) {
          showErrorToastAndDisableInputs(
            `Invalid Damage Quantity: Cannot exceed pallet quantity (${foundPallet.product_qty}).`,
            `Void Fail (DMG): Pallet ${foundPallet.plt_num}, Damage Qty (${damageQtyNum}) > Product Qty (${foundPallet.product_qty})`
          );
          setIsVoiding(false);
          return;
        }
        
        // If ACO Ref dictates full quantity, ensure damageQtyNum matches (already set by useEffect, but good to be robust)
        if (isDamageQtyDisabledForAco && damageQtyNum !== foundPallet.product_qty) {
            showErrorToastAndDisableInputs(
              'ACO Pallet Mismatch: Damage quantity for ACO pallet should be the full pallet quantity. Please re-verify.',
              `Void Fail (DMG): Pallet ${foundPallet.plt_num} (ACO), Damage Qty (${damageQtyNum}) !== Product Qty (${foundPallet.product_qty})`
            );
            setIsVoiding(false);
            return;
        }


        const palletInfoForDamage = {
          plt_num: foundPallet.plt_num,
          product_code: foundPallet.product_code,
          original_product_qty: foundPallet.product_qty, // original_product_qty is the pallet's current qty before voiding
          original_plt_loc: foundPallet.original_plt_loc!, // Assert non-null as foundPallet implies original_plt_loc is fetched
          plt_remark: foundPallet.plt_remark,
          series: foundPallet.series
        };

        result = await processDamagedPalletVoidAction({
          userId: userIdAsInt,
          palletInfo: palletInfoForDamage,
          password: passwordInput,
          voidReason: voidReason, // Could be "Damage" or more specific if UI allows
          damageQty: damageQtyNum,
        });

      } else { // Not "Damage" reason
        if (!foundPallet.original_plt_loc) {
             showErrorToastAndDisableInputs(
                'Cannot void pallet: Original location is missing.',
                `Void Fail (Non-DMG): Pallet ${foundPallet.plt_num} missing original_plt_loc`
             );
             setIsVoiding(false);
             return;
        }

        const palletInfoToVoid = {
          plt_num: foundPallet.plt_num,
          product_code: foundPallet.product_code,
          product_qty: foundPallet.product_qty,
          series: foundPallet.series || '', // Ensure series is a string, even if undefined
          current_location: foundPallet.original_plt_loc, // Pass original_plt_loc as current_location
          plt_remark: foundPallet.plt_remark,
        };

        result = await voidPalletAction({
          userId: userIdAsInt,
          palletInfo: palletInfoToVoid,
          password: passwordInput,
          voidReason: voidReason,
        });
      }

      // Handle Server Action response
      if (result.success) {
        toast.success(result.message || 'Pallet action completed successfully!');
        
        if (blockingErrorToastId) {
            toast.dismiss(blockingErrorToastId);
            setBlockingErrorToastId(null); // Clear the ID
        }
        setIsInputDisabled(false); // Re-enable inputs on success
        setIsVoiding(false); // Explicitly set isVoiding to false here
        resetState(); // Clear inputs and found pallet
        if (seriesInputRef.current) seriesInputRef.current.focus();

      } else { // result.error
        showErrorToastAndDisableInputs(
            result.error || 'An unknown error occurred during the voiding process.',
            `Void Fail Server Response: Pallet ${foundPallet.plt_num}, Reason: ${voidReason}, DmgQty: ${voidReason === 'Damage' ? damageQtyInput : 'N/A'}, ServerErr: ${result.error ? result.error.substring(0,100) : 'Unknown'}`
        );
        // No need to call setIsVoiding(false) here as showErrorToastAndDisableInputs does it.
      }

    } catch (error: any) {
      console.error('Client-side error during void confirmation:', error);
      showErrorToastAndDisableInputs(
        `Client Error: ${error.message || 'An unexpected client-side error occurred.'}`,
        `Void Fail Client Catch: Pallet ${foundPallet.plt_num}, Reason: ${voidReason}, ClientErr: ${error.message ? error.message.substring(0,100) : 'Unknown'}`
      );
      // No need to call setIsVoiding(false) here as showErrorToastAndDisableInputs does it.
    } finally {
      // setIsVoiding(false); // This is handled by showErrorToastAndDisableInputs or directly after success
      // Ensure isVoiding is reset if an error occurs BEFORE showErrorToastAndDisableInputs is called (e.g. parsing userId)
      // However, the structure above mostly calls showErrorToastAndDisableInputs which sets isVoiding to false.
      // If any path returns early without calling showErrorToastAndDisableInputs on error, then setIsVoiding(false) would be needed here.
      // Current early returns (e.g., for missing fields) are before setIsVoiding(true) or they call showErrorToastAndDisableInputs.
      // Let's ensure it's always reset if not already handled.
      if (isVoiding && !blockingErrorToastId) { // Only if not already handled by showErrorToast...
          setIsVoiding(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
      <div className="w-full max-w-4xl p-2 rounded-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-red-500">Void Pallet</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label htmlFor="seriesInput" className="block text-lg font-medium text-gray-300">
              QR Code
            </label>
            <Input
              id="seriesInput"
              type="text"
              ref={seriesInputRef}
              value={seriesInput}
              onChange={(e) => setSeriesInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'series')}
              onClick={() => {
                if (isMobile && !isInputDisabled) { // Check isInputDisabled
                  setShowScanner(true); 
                }
                setLastActiveInput('series');
              }}
              placeholder={isMobile ? "Tap To Scan QR" : "Scan QR Code"}
              className="w-full bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-orange-500 focus:border-orange-500 text-lg p-3"
              disabled={isLoading || isVoiding || isInputDisabled} // Add isInputDisabled
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="palletNumInput" className="block text-lg font-medium text-gray-300">Pallet Number</label>
            <Input
              ref={palletNumInputRef}
              id="palletNumInput"
              type="text"
              value={palletNumInput}
              onChange={(e) => setPalletNumInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'pallet_num')}
              onClick={() => setLastActiveInput('pallet_num')}
              placeholder="Input Pallet Number"
              className="w-full bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-orange-500 focus:border-orange-500 text-lg p-3"
              disabled={isLoading || isVoiding || isInputDisabled} // Add isInputDisabled
            />
          </div>
        </div>

        {/* Blocking error confirm button */} 
        {isInputDisabled && (
          <div className="my-4 flex justify-center">
            <Button
              onClick={handleConfirmError}
              variant="destructive"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-md"
            >
              Confirm
            </Button>
          </div>
        )}

        {(isLoading || isVoiding) && !isInputDisabled && ( // Only show loading if not disabled by error
          <div className="flex justify-center items-center my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500"></div>
            <p className="ml-4 text-lg">{isVoiding ? 'Voiding Pallet...' : 'Searching...'}</p>
          </div>
        )}

        {foundPallet && !isLoading && !isVoiding && !isInputDisabled && (
          <div className="mt-6 p-6 bg-gray-800 shadow-xl rounded-lg text-left">
            <h3 className="text-xl font-semibold text-red-400 mb-3">Pallet Information</h3>
            <p><strong>Pallet Number : </strong> {foundPallet.plt_num}</p>
            <p><strong>Product Code : </strong> {foundPallet.product_code}</p>
            <p><strong>Quantity : </strong> {foundPallet.product_qty}</p>
            <p><strong>Latest Location : </strong> {foundPallet.original_plt_loc || 'N/A'}</p>
            <p><strong>Remark : </strong> {foundPallet.plt_remark || 'N/A'}</p>
            
            {/* Directly show void inputs if pallet found and not voided */}
            {foundPallet.original_plt_loc !== 'Voided' && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-lg font-semibold mb-3 text-red-400">REMINDER : VOID PALLET CANNOT BE UNDONE</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="voidReason" className="block text-sm font-medium mb-1">Void Reason</label>
                    <Combobox
                      value={voidReason}
                      onValueChange={(value) => {
                        setVoidReason(value);
                        // If changing away from 'Damage' with an ACO pallet, reset related states
                        if (value !== 'Damage' && isDamageQtyDisabledForAco) {
                          setDamageQtyInput('');
                          setIsDamageQtyDisabledForAco(false);
                        }
                      }}
                      items={VOID_REASONS}
                      placeholder="Select void reason..."
                      disabled={isInputDisabled || isVoiding}
                      allowCustomValue={true}
                      searchPlaceholder="Search or add reason..."
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">User Password</label>
                    <Input 
                        id="password"
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter Login Password to Confirm"
                        className="w-full bg-gray-700 border-gray-600 rounded-md text-white"
                        disabled={isVoiding || isLoading || isInputDisabled}
                    />
                  </div>
                  {showDamageQtyInput && (
                    <div className="space-y-1">
                      <label htmlFor="damageQty" className="text-sm font-medium">Damage Qty:</label>
                      <Input
                        id="damageQty"
                        type="number"
                        value={damageQtyInput}
                        onChange={(e) => setDamageQtyInput(e.target.value)}
                        placeholder={`Enter damaged quantity (Max: ${foundPallet?.product_qty || 'N/A'})`}
                        disabled={isInputDisabled || isVoiding || isDamageQtyDisabledForAco}
                        min="1"
                        max={foundPallet?.product_qty?.toString() || undefined}
                      />
                      {isDamageQtyDisabledForAco && (
                        <p className="text-xs text-orange-600">
                          ACO Pallet: Damage quantity set to full pallet quantity for voiding.
                        </p>
                      )}
                      {foundPallet && parseInt(damageQtyInput) > foundPallet.product_qty && (
                          <p className="text-xs text-red-600">
                              Damage quantity cannot exceed pallet quantity ({foundPallet.product_qty}).
                          </p>
                      )}
                       {foundPallet && parseInt(damageQtyInput) <= 0 && damageQtyInput !== '' && (
                          <p className="text-xs text-red-600">
                              Damage quantity must be greater than 0.
                          </p>
                      )}
                    </div>
                  )}
                  <Button 
                      onClick={handleVoidConfirm}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
                      disabled={isVoiding || isLoading || !voidReason.trim() || !passwordInput.trim() || isInputDisabled}
                  >
                    {isVoiding ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Voiding Pallet...
                      </div>
                    ) : (
                      'Confirm Void Pallet'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {foundPallet.original_plt_loc === 'Voided' && (
                <p className="mt-4 text-yellow-400 font-semibold">This Pallet Has Already Been Voided.</p>
            )}
          </div>
        )}

        {/* Modal QrScanner */}
        <QrScanner
            open={showScanner}
            onClose={() => setShowScanner(false)}
            onScan={handleSeriesScan} 
            title="Scan Series QR Code"
            hint="Align QR code within the frame to scan"
        />

      </div>
    </div>
  );
} 