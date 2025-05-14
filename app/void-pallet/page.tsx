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
import { voidPalletAction } from './actions'; // Import server action (will be created later)

// Helper to get user from localStorage
const getUserId = (): number | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData && typeof userData.id !== 'undefined') {
          const idAsNumber = parseInt(userData.id, 10);
          if (!isNaN(idAsNumber)) {
            return idAsNumber;
          }
          console.error("Parsed user ID from localStorage is not a valid number:", userData.id);
          return null;
        }
        console.error("User data from localStorage does not contain an id field.");
        return null;
      } catch (e) {
        console.error("Error parsing user data from localStorage", e);
        return null;
      }
    }
  }
  return null;
};

interface FoundPalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  series: string; // Assuming series is needed
  current_location: string | null;
  plt_remark: string | null; // Add plt_remark
}

const VOID_REASONS = [
  { value: "Print Extra Label", label: "Print Extra Label" },
  { value: "Wrong Qty", label: "Wrong Qty" },
  { value: "Wrong Product Code", label: "Wrong Product Code" },
  { value: "Product Damage", label: "Product Damage" },
  { value: "Pallet Qty Changed", label: "Pallet Qty Changed" },
  { value: "Used Material", label: "Used Material" },
];

export default function VoidPalletPage() {
  const [seriesInput, setSeriesInput] = useState('');
  const [palletNumInput, setPalletNumInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundPallet, setFoundPallet] = useState<FoundPalletInfo | null>(null);
  const [lastActiveInput, setLastActiveInput] = useState<'series' | 'pallet_num' | null>('series');
  const [showScanner, setShowScanner] = useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isVoiding, setIsVoiding] = useState(false); // For voiding loading state

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
    // Do not reset passwordInput or voidReason here, manage in dialog
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
    let palletData: Omit<FoundPalletInfo, 'current_location'> | null = null;
    let errorOccurred = false;
    let searchedValueDisplay = searchValue;
    const formattedTime = format(new Date(), 'dd-MMM-yyyy HH:mm:ss');

    try {
      if (searchType === 'series') {
        const { data, error } = await supabase
          .from('record_palletinfo')
          // Select plt_remark as well
          .select('plt_num, product_code, product_qty, series, plt_remark') 
          .eq('series', searchValue)
          .single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows found
        palletData = data;
      } else { // pallet_num
        const { data, error } = await supabase
          .from('record_palletinfo')
          // Select plt_remark as well
          .select('plt_num, product_code, product_qty, series, plt_remark') 
          .eq('plt_num', searchValue)
          .single(); 
        if (error && error.code !== 'PGRST116') throw error;
        palletData = data;
      }

      if (palletData) {
        await fetchLatestLocation(palletData);
      } else {
        const palletNotFoundMsg = `Pallet : ${searchedValueDisplay} Not Found. Please Check Again`;
        toast.error(palletNotFoundMsg);
        await logHistory("Void Pallet Search Fail", null, null, `Pallet Not Found (Input: ${searchedValueDisplay})`);
        errorOccurred = true;
      }
    } catch (error: any) {
      console.error('Error searching pallet:', error);
      toast.error(`Error searching pallet: ${error.message}`);
      await logHistory("Void Pallet Search Fail", null, null, `Search Error (Input: ${searchedValueDisplay}, Error: ${error.message})`);
      errorOccurred = true;
    } finally {
      setIsLoading(false);
      if (errorOccurred) {
        resetInputFields();
      }
    }
  };

  const fetchLatestLocation = async (palletInfo: Omit<FoundPalletInfo, 'current_location'>) => {
    setIsLoading(true);
    const formattedTime = format(new Date(), 'dd-MMM-yyyy HH:mm:ss');
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('record_history')
        .select('loc')
        .eq('plt_num', palletInfo.plt_num)
        .order('time', { ascending: false })
        .limit(1)
        .single();

      if (historyError && historyError.code !== 'PGRST116') throw historyError; 

      const currentLocation = historyData?.loc || null;
      // Set foundPallet first to allow other UI to react if needed, then check void status
      setFoundPallet({ ...palletInfo, current_location: currentLocation });
      
      if (currentLocation === 'Voided') {
          const alreadyVoidMsg = `Pallet : ${palletInfo.plt_num} Is Already Voided`;
          toast.info(alreadyVoidMsg);
          // Clear inputs and found pallet display if already voided
          resetInputFields(); 
          setFoundPallet(null); // Explicitly clear found pallet info display
          // Focus back to the first input (series) might be good UX here
          setLastActiveInput('series');
      } else {
          const foundMsg = `Pallet : ${palletInfo.plt_num} Found at location ${currentLocation || 'N/A'}. Ready to Void. - ${formattedTime}`;
          console.log(foundMsg); // Keep for debugging or remove for production
      }

    } catch (error: any) {
      console.error('Error fetching latest location:', error);
      const fetchLocErrorMsg = `Error fetching location for ${palletInfo.plt_num}: ${error.message} - ${formattedTime}`;
      toast.error(`Error fetching location: ${error.message}`);
      await logHistory("Void Pallet Search Fail", palletInfo.plt_num, null, `Fetch Location Error: ${error.message}`);
      resetInputFields();
    } finally {
        setIsLoading(false);
    }
  };

  // Handle Enter key press for inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, inputType: 'series' | 'pallet_num') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isLoading || isVoiding) return;
      setLastActiveInput(inputType);
      if (inputType === 'series' && seriesInput.trim()) {
        handleSearch('series', seriesInput.trim());
      } else if (inputType === 'pallet_num' && palletNumInput.trim()) {
        handleSearch('pallet_num', palletNumInput.trim());
      }
    }
  };
  
  useEffect(() => {
    if (!isLoading && !isVoiding && !isVoidDialogOpen) {
      if (lastActiveInput === 'series' && seriesInputRef.current) {
        seriesInputRef.current.focus();
      } else if (lastActiveInput === 'pallet_num' && palletNumInputRef.current) {
        palletNumInputRef.current.focus();
      }
    }
  }, [isLoading, isVoiding, lastActiveInput, isVoidDialogOpen, foundPallet]);

  const handleSeriesScan = (scannedValue: string) => {
    if (scannedValue) {
      setSeriesInput(scannedValue);
      // Optionally trigger search immediately after scan
      handleSearch('series', scannedValue);
      setLastActiveInput('pallet_num'); // Or keep focus if preferred
    }
    setShowScanner(false); // Close the modal scanner
  };
  
  const handleOpenVoidDialog = () => {
    if (foundPallet && foundPallet.current_location === 'Voided') {
        const formattedTime = format(new Date(), 'dd-MMM-yyyy HH:mm:ss');
        toast.info(`Pallet ${foundPallet.plt_num} Has Already Been Voided.`);
        // Clear inputs and found pallet display if confirmed already voided when trying to open dialog
        resetInputFields();
        setFoundPallet(null);
        setLastActiveInput('series');
        return;
    }
    // If not voided, proceed to open dialog
    setVoidReason(''); 
    setPasswordInput(''); // Reset password
    setIsVoidDialogOpen(true);
  };

  const handleCancelVoid = () => {
    setIsVoidDialogOpen(false);
    // setPasswordInput(''); // Reset password on cancel
    // setVoidReason('');    // Reset reason on cancel
    // Re-focus logic handled by useEffect
    if (lastActiveInput === 'series' && seriesInputRef.current) {
        seriesInputRef.current.focus();
    } else if (lastActiveInput === 'pallet_num' && palletNumInputRef.current) {
        palletNumInputRef.current.focus();
    }
  };

  const handleVoidConfirm = async () => {
    if (!foundPallet) {
        toast.error('No pallet selected to void.');
        return;
    }
    if (!voidReason.trim()) {
        toast.error('Please Select Or Enter A Void Reason.');
        return;
    }
    if (!passwordInput.trim()) {
        toast.error('Please Enter Your Password For Confirmation.');
        return;
    }
    
    setIsVoiding(true);
    const userId = getUserId();
    if (!userId) {
        toast.error('User Password Error. Stop Performing Action.');
        setIsVoiding(false);
        return;
    }
    const formattedTime = format(new Date(), 'dd-MMM-yyyy HH:mm:ss');

    try {
        // Call the server action
        const result = await voidPalletAction({
            userId: userId,
            palletInfo: foundPallet,
            password: passwordInput,
            voidReason: voidReason.trim(),
        });

        if (result.success) {
            toast.success(`Pallet ${foundPallet.plt_num} voided successfully.`);
            // const successMsg = `Pallet ${foundPallet.plt_num} voided successfully. Reason: ${voidReason.trim()} - ${formattedTime}`; // Not directly used, consider removing if not logged elsewhere
            resetState(); // Reset everything on success
            setIsVoidDialogOpen(false); // Close dialog
        } else {
            let userFriendlyError = 'Failed to void pallet. Please try again.'; // Default error
            if (result.error) {
                const lowerError = result.error.toLowerCase(); // For case-insensitive matching
                if (lowerError.includes("password not match") || lowerError.includes("password mismatch")) {
                    userFriendlyError = "Incorrect password. Please check and try again.";
                } else if (lowerError.includes("already voided")) {
                    userFriendlyError = `Pallet ${foundPallet?.plt_num || 'Selected pallet'} has already been voided. No further action taken.`;
                    // If server confirms already voided, also reset UI
                    resetInputFields();
                    setFoundPallet(null);
                    setIsVoidDialogOpen(false); // Close the dialog as well
                    setLastActiveInput('series');
                } else if (lowerError.includes("could not verify user information") || lowerError.includes("user data fetch error")) {
                    userFriendlyError = "Could not verify your user information. Please try logging out and in again.";
                } else if (lowerError.includes("user account configuration error") || lowerError.includes("user password missing")) {
                    userFriendlyError = "There is a configuration issue with your user account. Please contact an administrator.";
                } else if (lowerError.includes("database operation failed") || lowerError.includes("database operation reported an error")) {
                    userFriendlyError = "A database error occurred while attempting to void the pallet. Please contact support if this issue persists.";
                } else if (lowerError.includes("missing required information")) {
                    userFriendlyError = "Missing required information. Please ensure all fields are correctly filled.";
                } else if (lowerError.includes("missing or invalid current location")) {
                    userFriendlyError = "Pallet location is invalid or missing. Cannot proceed.";
                } else {
                    userFriendlyError = result.error; // Fallback to the original error if no specific match
                }
            }
            toast.error(userFriendlyError);
            // Keep dialog open on error for correction, password will be cleared by finally block
        }
    } catch (error: any) {
        console.error('Error calling voidPalletAction:', error);
        toast.error('An unexpected error occurred.');
        const unexpectedErrorMsg = `Unexpected error voiding pallet ${foundPallet.plt_num}: ${error.message} - ${formattedTime}`;
        // Keep dialog open
    } finally {
        setIsVoiding(false);
        setPasswordInput(''); // Clear password input after attempt
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
                if (isMobile) {
                  setShowScanner(true); // Open modal scanner on mobile when input is clicked
                }
                setLastActiveInput('series');
              }}
              placeholder={isMobile ? "Tap To Scan QR" : "Scan QR Code"}
              className="w-full bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-orange-500 focus:border-orange-500 text-lg p-3"
              disabled={isLoading || isVoiding}
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
              disabled={isLoading || isVoiding}
            />
          </div>
        </div>

        {(isLoading || isVoiding) && (
          <div className="flex justify-center items-center my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500"></div>
            <p className="ml-4 text-lg">{isVoiding ? 'Voiding Pallet...' : 'Searching...'}</p>
          </div>
        )}

        {foundPallet && !isLoading && !isVoiding && (
          <div className="mt-6 p-6 bg-gray-800 shadow-xl rounded-lg text-left">
            <h3 className="text-xl font-semibold text-red-400 mb-3">Pallet Found:</h3>
            <p><strong>Pallet Number:</strong> {foundPallet.plt_num}</p>
            <p><strong>Product Code:</strong> {foundPallet.product_code}</p>
            <p><strong>Quantity:</strong> {foundPallet.product_qty}</p>
            <p><strong>Current Location:</strong> {foundPallet.current_location || 'N/A'}</p>
            <p><strong>Remark:</strong> {foundPallet.plt_remark || 'N/A'}</p>
            {foundPallet.current_location !== 'Voided' && (
                <Button 
                    onClick={handleOpenVoidDialog}
                    className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
                    disabled={isVoiding}
                >
                    Proceed to Void Pallet
                </Button>
            )}
            {foundPallet.current_location === 'Voided' && (
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

        {/* Void Confirmation Dialog */}
        <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-red-500">Confirm Void Pallet</DialogTitle>
              <DialogDescription className="text-gray-400">
                You are about to void pallet <strong className="text-red-400">{foundPallet?.plt_num}</strong>. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                        disabled={isVoiding}
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                    <Input 
                        id="password"
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Please Enter Your Password To Continue"
                        className="w-full bg-gray-700 border-gray-600 rounded-md text-white"
                        disabled={isVoiding}
                    />
                    <p className="mt-1 text-xs text-gray-500">Your password is required to confirm this critical action.</p>
                </div>
            </div>
            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button 
                  onClick={handleCancelVoid} 
                  disabled={isVoiding} 
                  className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                    Cancel
                </Button>
              </DialogClose>
              <Button onClick={handleVoidConfirm} disabled={isVoiding || !voidReason || !passwordInput} className="bg-red-600 hover:bg-red-700">
                {isVoiding ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Voiding...
                  </div>
                ) : (
                  'Confirm Void'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
} 