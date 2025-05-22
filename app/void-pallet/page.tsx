'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '../../lib/supabase'; // Assuming supabase client is here
import { format } from 'date-fns'; // For date formatting
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input'; // Import Input
import { QrScanner } from '../../components/qr-scanner/qr-scanner'; // Modal QrScanner
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../../components/ui/dialog'; // Import Dialog components
import { Combobox } from '@/components/ui/combobox'; // Import Combobox
import { verifyCurrentUserPasswordAction } from '../../app/actions/authActions'; // For password verification
import { voidPalletAction, processDamagedPalletVoidAction } from './actions'; // Import server actions
import { useRouter } from 'next/navigation'; // Added for redirection

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
  { value: "Wrong Label", label: "Wrong Label" },
  { value: "Wrong Qty", label: "Wrong Qty" },
  { value: "Wrong Product Code", label: "Wrong Product Code" },
  { value: "Damage", label: "Damage" },
  //{ value: "Pallet Qty Changed", label: "Pallet Qty Changed" },
  { value: "Used Material", label: "Used Material" },
  { value: "Other", label: "Other (Specify if possible)" }, 
];

const supabase = createClient();

export default function VoidPalletPage() {
  const router = useRouter(); // Added for redirection
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

  // New states for reprint dialog
  const [showReprintConfirmDialog, setShowReprintConfirmDialog] = useState(false);
  const [reprintInfo, setReprintInfo] = useState<{ 
    product_code: string; 
    quantity: number; 
    original_plt_num: string; 
    source_action: string; 
    requiresInput: boolean; // True if further input (new product_code/qty) is needed
    reason: string; // The original void reason
    target_location?: string | null; // Added target_location
  } | null>(null);

  // New states for the second dialog (for inputting new product code/qty)
  const [showReprintInputDialog, setShowReprintInputDialog] = useState(false);
  const [reprintNewProductCode, setReprintNewProductCode] = useState('');
  const [reprintNewQuantity, setReprintNewQuantity] = useState('');

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
    // Ensure dialogs are closed if error occurs mid-process
    setShowReprintConfirmDialog(false);
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
    setLastActiveInput('series'); // Set last active input
    // Trigger search immediately after scan
      handleSearch('series', scannedValue);
  };
  
  // Main function to handle the voiding process
  const handleVoidConfirm = async () => {
    if (!foundPallet || !voidReason || !passwordInput) {
      toast.error('Please fill in all required fields (Pallet Info, Void Reason, Password).');
        return;
    }
    if (voidReason === 'Damage' && !damageQtyInput) {
        toast.error('Damage Quantity is required.');
        return;
    }
    if (voidReason === 'Damage') {
        const qty = parseInt(damageQtyInput, 10);
        if (isNaN(qty) || qty < 0 || qty > foundPallet.product_qty) {
            toast.error('Damage Quantity must be a valid number, between 0 and the original pallet quantity.');
            return;
        }
    }
    if (!userId) { // Ensure userId from session is available
        toast.error('Invalid User Session. Please refresh page or re-login.');
        logErrorToDatabase(`Void attempt failed: User ID missing from session. Pallet: ${foundPallet.plt_num}`);
        return;
    }

    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
        toast.error('User ID Format Error.');
        logErrorToDatabase(`Void attempt failed: User ID invalid (${userId}). Pallet: ${foundPallet.plt_num}`);
        return;
    }

    
    setIsVoiding(true);
    let toastId = toast.loading('Verifying Password...');

    try {
      // Pass numericUserId to the verification action
      const passVerifyResult = await verifyCurrentUserPasswordAction(numericUserId, passwordInput);

      if (!passVerifyResult.success) { // userId is NOT part of passVerifyResult
        toast.error(passVerifyResult.error || 'Password Error.', { id: toastId });
        setIsVoiding(false);
        setPasswordInput(''); // Clear password input on error
        if (passVerifyResult.error) {
            const dbErrInfo = `Password verification failed for voiding pallet ${foundPallet.plt_num}. UserID: ${numericUserId}. Error: ${passVerifyResult.error}`;
            logErrorToDatabase(dbErrInfo);
        }
        return;
    }
      
      // Use numericUserId directly as it's already validated and available
      const currentUserIdForAction = numericUserId; 

      toast.loading('Void Precessing...', { id: toastId });

      let result;
      
      if (voidReason === 'Damage') {
        const damageQty = parseInt(damageQtyInput, 10); // Already validated
        // Corrected structure for PalletInfoForDamage
        const palletInfoForDamageAction: {
            plt_num: string;
            product_code: string;
            original_product_qty: number;
            original_plt_loc: string;
            plt_remark: string | null;
            series?: string | null;
        } = {
            plt_num: foundPallet.plt_num,
            product_code: foundPallet.product_code,
            original_product_qty: foundPallet.product_qty,
            original_plt_loc: foundPallet.original_plt_loc || '', // Ensure string, though it should exist
            plt_remark: foundPallet.plt_remark,
            series: foundPallet.series,
        };
        result = await processDamagedPalletVoidAction({
          palletInfo: palletInfoForDamageAction,
          damageQty: damageQty,
          voidReason: voidReason,
          userId: currentUserIdForAction, // Pass numeric userId
          password: passwordInput, // Restore password argument for server action
        });
      } else {
        // Corrected structure for PalletInfo
        const palletInfoForVoidAction: {
            plt_num: string;
            product_code: string;
            product_qty: number;
            series: string;
            current_location: string | null;
            plt_remark: string | null;
        } = {
            plt_num: foundPallet.plt_num,
            product_code: foundPallet.product_code,
            product_qty: foundPallet.product_qty,
            series: foundPallet.series || '', // Provide default for series
            current_location: foundPallet.original_plt_loc,
            plt_remark: foundPallet.plt_remark,
        };
        result = await voidPalletAction({
          palletInfo: palletInfoForVoidAction,
          voidReason: voidReason,
          userId: currentUserIdForAction, // Pass numeric userId
          password: passwordInput, // Restore password argument for server action
        });
      }

        if (result.success) {
        // toast.success(result.message || 'Void Success!', { id: toastId }); // 個別情況會顯示更具體嘅toast
        
        const reasonsAllowingReprint = ["Wrong Qty", "Wrong Product Code", "Damage", "Pallet Qty Changed", "Wrong Label"];
        
        if (voidReason === "Damage" && foundPallet) {
            const remainingQty = result.remainingQty; 
            const actual_original_location = result.actual_original_location; // 從 result 獲取

            if (typeof remainingQty === 'number' && remainingQty > 0 && actual_original_location) { // 檢查 actual_original_location
                toast.success(`Pallet ${foundPallet.plt_num} partially voided. Remaining: ${remainingQty}. Redirecting to print new label for location: ${actual_original_location}.`, { id: toastId });
                const queryParams = new URLSearchParams({
                    product_code: foundPallet.product_code,
                    quantity: remainingQty.toString(),
                    source_action: 'void_correction_damage_partial',
                    original_plt_num: foundPallet.plt_num,
                    target_location: actual_original_location, // 新增 target_location
                });
                router.push(`/print-label?${queryParams.toString()}`);
                
                resetState();
                setIsVoiding(false);
                setPasswordInput('');
                // No longer log client-side for successful void if server action/RPC handles it.
                // await logHistory(`Pallet ${foundPallet.plt_num} voided (Partial Damage)`, foundPallet.plt_num, foundPallet.original_plt_loc, `Reason: ${voidReason}, Damage Qty: ${damageQtyInput}, Remaining Qty: ${remainingQty}. New label at ${actual_original_location}.`);
                return; 
            } else if (typeof remainingQty === 'number' && remainingQty > 0 && !actual_original_location) {
                toast.error(`Pallet ${foundPallet.plt_num} partially voided. Remaining: ${remainingQty}. BUT original location for reprint not found. Cannot redirect automatically. Please print label manually.`, { id: toastId, duration: 8000 });
                // 即使冇 original_location，都應該重置狀態同記錄歷史
                resetState();
                setIsVoiding(false);
                setPasswordInput('');
                // No longer log client-side for successful void if server action/RPC handles it.
                // await logHistory(`Pallet ${foundPallet.plt_num} voided (Partial Damage) - Error`, foundPallet.plt_num, foundPallet.original_plt_loc, `Reason: ${voidReason}, Damage Qty: ${damageQtyInput}, Remaining Qty: ${remainingQty}. Failed to get original location for auto-reprint.`);
                return;
            } else if (typeof remainingQty === 'number' && remainingQty === 0) {
                toast.success(result.message || `Pallet ${foundPallet.plt_num} fully voided (Damage). No reprint needed.`, { id: toastId });
                resetState();
                setIsVoiding(false);
                setPasswordInput('');
                // No longer log client-side for successful void if server action/RPC handles it.
                // await logHistory(`Pallet ${foundPallet.plt_num} voided (Full Damage)`, foundPallet.plt_num, foundPallet.original_plt_loc, `Reason: ${voidReason}, Damage Qty: ${damageQtyInput}. No reprint.`);
                return;
            }
        } else if (reasonsAllowingReprint.includes(voidReason) && foundPallet) {
            // 其他允許重新列印嘅原因，保留原有彈窗邏C輯
            toast.success(result.message || 'Void Success! Check for reprint options.', { id: toastId }); // General success for these cases
            let productCodeForReprint = foundPallet.product_code;
            let quantityForReprint = foundPallet.product_qty;
            let requiresInputForReprint = false;

            if (voidReason === "Wrong Qty" || voidReason === "Pallet Qty Changed") {
                requiresInputForReprint = true; 
            } else if (voidReason === "Wrong Product Code") {
                requiresInputForReprint = true; 
            } else if (voidReason === "Wrong Label") {
                requiresInputForReprint = true; 
            }
            
            // Determine the original location for the reprint
            const originalLocationForReprint = result.actual_original_location || foundPallet.original_plt_loc;

            setReprintInfo({
                product_code: productCodeForReprint,
                quantity: quantityForReprint,
                original_plt_num: foundPallet.plt_num,
                source_action: 'void_correction',
                requiresInput: requiresInputForReprint,
                reason: voidReason,
                target_location: originalLocationForReprint, // Populate target_location
            });
            setShowReprintConfirmDialog(true);
            // 呢度唔 return，因為 setIsVoiding(false) 同 setPasswordInput('') 會喺 finally 處理 (如果唔係 damage case)
            // 歷史記錄亦會喺下面統一處理 (如果唔係 damage case)
        } else {
            // 作廢原因唔允許重新列印，或者 foundPallet 唔存在
            toast.success(result.message || 'Void Success!', { id: toastId });
            resetState();
            // 歷史記錄會喺下面統一處理
        }
        
        // 只有當唔係 Damage case，並且 foundPallet 存在時，先執行呢個通用歷史記錄
        if (voidReason !== "Damage" && foundPallet) {
            // No longer log client-side for successful void if server action/RPC handles it.
            // await logHistory(`Pallet ${foundPallet.plt_num} voided`, foundPallet.plt_num, foundPallet.original_plt_loc, `Reason: ${voidReason}`);
        }

      } else {
        const errMsg = result.error || 'Unknown error during voiding pallet.';
        const dbErrInfo = `Voiding pallet ${foundPallet.plt_num} failed. Reason: ${voidReason}. UserID: ${currentUserIdForAction}. Error from action: ${result.error}`;
        // toast.error(errMsg, { id: toastId }); // Show a normal toast
        showErrorToastAndDisableInputs(errMsg, dbErrInfo); // Use blocking toast for critical failure
      }

    } catch (error: any) {
      const errMsg = `Error during voiding pallet: ${error.message || 'Unknown error'}`;
      const dbErrInfo = `Exception during voiding pallet ${foundPallet?.plt_num}. Reason: ${voidReason}. UserID: ${numericUserId}. Error: ${error.message}`;
      // toast.error(errMsg, { id: toastId });
      showErrorToastAndDisableInputs(errMsg, dbErrInfo);
    } finally {
      //setIsVoiding(false); // Do not set isVoiding false here if reprint dialog is shown
      // Password should be cleared regardless of success/failure if action was attempted
      // setPasswordInput(''); // Let it be cleared on resetState or successful dialog interaction
      if (!showReprintConfirmDialog) { // only set to false if not showing reprint dialog
          setIsVoiding(false);
          setPasswordInput(''); 
      }
    }
  };

  const handleReprintConfirmed = () => {
    if (reprintInfo) {
      if (reprintInfo.requiresInput) {
        // Prepare and show the second dialog for user input
        setReprintNewProductCode(reprintInfo.product_code); // Prefill with original product code
        setReprintNewQuantity(reprintInfo.quantity.toString()); // Prefill with original quantity
        
        // Adjust prefill based on reason
        if (reprintInfo.reason === "Wrong Qty" || reprintInfo.reason === "Pallet Qty Changed") {
          // Keep product_code, user needs to change quantity
          setReprintNewQuantity(''); // Clear quantity for user to input new
        } else if (reprintInfo.reason === "Wrong Product Code") {
          // Keep quantity, user needs to change product_code
          setReprintNewProductCode(''); // Clear product_code for user to input new
        } else if (reprintInfo.reason === "Wrong Label") {
          // User needs to change both
          setReprintNewProductCode('');
          setReprintNewQuantity('');
        }

        setShowReprintConfirmDialog(false); // Hide the first dialog
        setShowReprintInputDialog(true);    // Show the input dialog
      } else {
        // No input required, directly redirect (this path is less common for non-damage, mostly for damage with remaining qty)
        const queryParams = new URLSearchParams({
          product_code: reprintInfo.product_code,
          quantity: reprintInfo.quantity.toString(),
          source_action: reprintInfo.source_action,
          original_plt_num: reprintInfo.original_plt_num,
        });
        if (reprintInfo.target_location) { // Add target_location if available
          queryParams.set('target_location', reprintInfo.target_location);
        }
        router.push(`/print-label?${queryParams.toString()}`);
        
        setShowReprintConfirmDialog(false);
        setReprintInfo(null);
        resetState();
        setIsVoiding(false); 
        setPasswordInput('');
      }
    }
  };

  const handleReprintCancelled = () => {
    setShowReprintConfirmDialog(false);
    // also ensure input dialog is closed if user cancels from first dialog
    setShowReprintInputDialog(false); 
    setReprintInfo(null);
    resetState();
    setIsVoiding(false); 
    setPasswordInput('');
    toast.info("Pallet voided, no reprint label selected.");
  };

  // New handler for the second dialog (input for reprint)
  const handleReprintInputSubmit = () => {
    if (reprintInfo) {
      const finalProductCode = reprintNewProductCode.trim() || reprintInfo.product_code;
      const finalQuantityStr = reprintNewQuantity.trim();
      const finalQuantity = parseInt(finalQuantityStr, 10);

      if (!finalProductCode) {
        toast.error("Product Code cannot be empty.");
        return;
      }
      if (isNaN(finalQuantity) || finalQuantity <= 0) {
        toast.error("Quantity must be a valid number greater than 0.");
        return;
      }

      const queryParams = new URLSearchParams({
        product_code: finalProductCode,
        quantity: finalQuantity.toString(),
        source_action: reprintInfo.source_action,
        original_plt_num: reprintInfo.original_plt_num,
      });
      if (reprintInfo.target_location) { // Add target_location if available
        queryParams.set('target_location', reprintInfo.target_location);
      }
      router.push(`/print-label?${queryParams.toString()}`);

      setShowReprintInputDialog(false);
      setReprintInfo(null);
      resetState();
        setIsVoiding(false);
      setPasswordInput('');
    }
  };

  const handleReprintInputCancel = () => {
    setShowReprintInputDialog(false);
    setReprintInfo(null); // Clear reprint info as the process is cancelled
    resetState();
    setIsVoiding(false); 
    setPasswordInput('');
    toast.info("Reprint cancelled.");
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
                <h4 className="text-lg font-semibold mb-3 text-red-400">REMINDER : VOID ACTION CANNOT BE UNDONE</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="voidReason" className="block text-sm font-medium mb-1">Void Reason</label>
                    <Combobox
                      value={voidReason}
                      onValueChange={(value) => {
                        setVoidReason(value);
                        // Potentially reset damageQtyInput if reason changes from "Damage"
                        // This is handled by the useEffect on [voidReason, foundPallet]
                      }}
                      items={VOID_REASONS}
                      placeholder="Select OR Type In Void Reason"
                      disabled={!foundPallet || isInputDisabled || isVoiding}
                      className="w-full bg-gray-900 text-white placeholder-gray-400 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500"
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
                      <label htmlFor="damageQty" className="text-sm font-medium">Damage Qty</label>
                      <Input
                        id="damageQty"
                        type="number"
                        value={damageQtyInput}
                        onChange={(e) => setDamageQtyInput(e.target.value)}
                        placeholder={`Enter damaged quantity (Max: ${foundPallet?.product_qty || 'N/A'})`}
                        disabled={isInputDisabled || isVoiding || isDamageQtyDisabledForAco}
                        min="1"
                        max={foundPallet?.product_qty?.toString() || undefined}
                        className="w-full bg-gray-900 text-white placeholder-gray-400 border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      />
                      {isDamageQtyDisabledForAco && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                            This pallet is associated with an ACO order, the damaged quantity is automatically set to the total quantity.
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

        {/* Reprint Confirmation Dialog */}
        <Dialog open={showReprintConfirmDialog} onOpenChange={(isOpen) => {
          if (!isOpen) { // If dialog is closed by user (e.g. Esc or overlay click)
              handleReprintCancelled();
          } else {
              setShowReprintConfirmDialog(isOpen);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reprint Correction Label</DialogTitle>
              <DialogDescription>
                {reprintInfo?.reason === "Damage" && reprintInfo.quantity > 0 ?
                  `Pallet voided (partial damage). Remaining quantity: ${reprintInfo.quantity}. Print new label for this remaining quantity?` :
                reprintInfo?.reason === "Damage" && reprintInfo.quantity === 0 ?
                  `Pallet fully damaged and voided.` : // This case should ideally be handled before showing dialog
                  `Pallet been voided. Suggest to print new label for the remaining quantity`
                }
                {reprintInfo && reprintInfo.requiresInput && reprintInfo.reason !== "Damage" && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select "Yes" to transfer you to print replacement label.
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleReprintCancelled}>No</Button>
              {/* For "Damage" with 0 quantity, "Yes" button should not be shown or should be disabled,
                  but this case should be handled before even showing the dialog.
                  If reprintInfo.quantity is 0 due to full damage, the dialog text covers it,
                  and the 'Yes' button would effectively do nothing or lead to printing a 0 qty label, which is bad.
                  The logic in handleVoidConfirm already tries to prevent this dialog for 0 remainingQty.
              */}
              {!(reprintInfo?.reason === "Damage" && reprintInfo.quantity === 0) && (
                   <Button onClick={handleReprintConfirmed}>Yes</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reprint Input Dialog (Second Dialog) */}
        <Dialog open={showReprintInputDialog} onOpenChange={(isOpen) => {
          if (!isOpen) handleReprintInputCancel();
          else setShowReprintInputDialog(isOpen);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Input Correction Label Information</DialogTitle>
              <DialogDescription>
                Please provide the following information for the new label. Void Reason: {reprintInfo?.reason}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="reprintProductCode" className="text-right col-span-1">
                  Product Code
                </label>
                <Input
                  id="reprintProductCode"
                  value={reprintNewProductCode}
                  onChange={(e) => setReprintNewProductCode(e.target.value)}
                  className="col-span-3"
                  disabled={reprintInfo?.reason === "Wrong Qty" || reprintInfo?.reason === "Pallet Qty Changed"}
                    />
                </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="reprintQuantity" className="text-right col-span-1">
                  Quantity
                </label>
                    <Input 
                  id="reprintQuantity"
                  type="number"
                  value={reprintNewQuantity}
                  onChange={(e) => setReprintNewQuantity(e.target.value)}
                  className="col-span-3"
                  disabled={reprintInfo?.reason === "Wrong Product Code"}
                />
                </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleReprintInputCancel}>Cancel</Button>
              <Button onClick={handleReprintInputSubmit}>Submit and Print</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
} 