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
import { voidPalletAction } from './actions'; // Import server action (will be created later)

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
  { value: "Product Damage", label: "Product Damage" },
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

  // Refs for input elements
  const seriesInputRef = useRef<HTMLInputElement>(null);
  const palletNumInputRef = useRef<HTMLInputElement>(null);

  // 行動裝置判斷
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  const resetInputFields = () => {
    setSeriesInput('');
    setPalletNumInput('');
  };

  const resetState = () => {
    resetInputFields();
    setFoundPallet(null);
    setVoidReason(''); // Clear void reason on reset
    setPasswordInput(''); // Clear password on reset
    // Do not reset isInputDisabled or blockingErrorToastId here unless specifically intended
  };

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
    if (scannedValue) {
      setSeriesInput(scannedValue);
      // Optionally trigger search immediately after scan
      handleSearch('series', scannedValue);
      setLastActiveInput('pallet_num'); // Or keep focus if preferred
    }
    setShowScanner(false); // Close the modal scanner
  };
  
  const handleVoidConfirm = async () => {
    if (!foundPallet) {
        // This case should ideally be prevented by UI, but as a safeguard:
        showErrorToastAndDisableInputs('No pallet selected to void. Please search again.', 'Void attempt: foundPallet is null');
        return;
    }
    if (foundPallet.original_plt_loc === null) {
        showErrorToastAndDisableInputs('Pallet location information is missing. Cannot void.', `Void attempt: original_plt_loc is null for ${foundPallet.plt_num}`);
        return;
    }
     if (foundPallet.original_plt_loc === 'Voided') {
        // This should also be caught by handleSearch, but as a defense:
        showErrorToastAndDisableInputs(`Pallet ${foundPallet.plt_num} is already voided. Action cancelled.`, `Void attempt: already voided ${foundPallet.plt_num}`);
        return;
    }
    if (!voidReason.trim()) {
        toast.error('Please Select Or Enter A Void Reason.'); // Standard non-blocking toast for simple validation
        return;
    }
    if (!passwordInput.trim()) {
        toast.error('Please Enter Your Login Password For Confirmation.'); // Standard non-blocking toast
        return;
    }
    
    setIsVoiding(true);
    if (!userId) {
        showErrorToastAndDisableInputs('User ID not found. Cannot perform void action.', 'Void attempt: userId is null');
        setIsVoiding(false); 
        return;
    }

    try {
        // Ensure userId is a number for the action, and rename palletDetails to palletInfo
        const userIdAsInt = parseInt(userId, 10);
        if (isNaN(userIdAsInt)) {
            showErrorToastAndDisableInputs('Invalid User ID format.', `Void attempt: userId NaN - ${userId}`);
            setIsVoiding(false);
            return;
        }

        const result = await voidPalletAction({
            userId: userIdAsInt, 
            palletInfo: {      
                plt_num: foundPallet.plt_num,
                product_code: foundPallet.product_code,
                product_qty: foundPallet.product_qty,
                series: foundPallet.series || '', // Provide empty string if series is undefined
                current_location: foundPallet.original_plt_loc, // Map original_plt_loc to current_location for the action
                plt_remark: foundPallet.plt_remark, // Add plt_remark
            },
            password: passwordInput,
            voidReason: voidReason.trim(),
        });

        if (result.success) {
            toast.success(`Pallet ${foundPallet.plt_num} voided successfully.`);
            resetState(); 
        } else {
            // More detailed error handling based on result.error
            const errorMsg = result.error || 'Unknown error from void action.';
            if (errorMsg.toLowerCase().includes("password mismatch")) {
                toast.error("Incorrect password. Please check and try again.");
                // Keep inputs for password re-entry, don't disable everything
            } else if (errorMsg.startsWith("RPC_ERROR:")) {
                // These are critical errors from the database RPC
                const rpcSpecificError = errorMsg.replace("RPC_ERROR:", "").trim();
                showErrorToastAndDisableInputs(
                    `Failed to void pallet: ${rpcSpecificError}`,
                    `Void RPC Error: ${foundPallet.plt_num} - ${rpcSpecificError}`
                );
            } else {
                // Other server-side errors reported by the action
                showErrorToastAndDisableInputs(
                    `Failed to void pallet: ${errorMsg}`,
                    `Void Action Error: ${foundPallet.plt_num} - ${errorMsg}`
                );
            }
        }
    } catch (error: any) {
        console.error('Critical error calling voidPalletAction:', error);
        const errMsg = error.message || 'An unexpected error occurred during void process.';
        showErrorToastAndDisableInputs(
            `Voiding Operation Failed: ${errMsg}`,
            `Critical Void Exception: ${foundPallet?.plt_num || 'N/A'} - ${errMsg}`
        );
    } finally {
        setIsVoiding(false);
        setPasswordInput(''); 
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 text-white">
      <div className="w-full max-w-4xl p-2 rounded-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-red-500">Void Pallet</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label htmlFor="seriesInput" className="block text-lg font-medium text-gray-300">
              QR Code / Series
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
            <p><strong>Pallet Number:</strong> {foundPallet.plt_num}</p>
            <p><strong>Product Code:</strong> {foundPallet.product_code}</p>
            <p><strong>Quantity:</strong> {foundPallet.product_qty}</p>
            <p><strong>Latest Location:</strong> {foundPallet.original_plt_loc || 'N/A'}</p>
            <p><strong>Remark:</strong> {foundPallet.plt_remark || 'N/A'}</p>
            
            {/* Directly show void inputs if pallet found and not voided */}
            {foundPallet.original_plt_loc !== 'Voided' && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-lg font-semibold mb-3 text-red-400">Void Pallet Confirmation</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="voidReason" className="block text-sm font-medium mb-1">Void Reason</label>
                    <Combobox
                        items={VOID_REASONS}
                        value={voidReason}
                        onValueChange={setVoidReason}
                        placeholder="Select Or Type A Reason..."
                        searchPlaceholder="Search Or Add Reason..."
                        className="w-full bg-gray-700 border-gray-600 rounded-md text-white"
                        triggerClassName="w-full bg-gray-700 border-gray-600 text-white"
                        contentClassName="bg-gray-700 text-white"
                        allowCustomValue={true}
                        disabled={isVoiding || isLoading || isInputDisabled}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
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