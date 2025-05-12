'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase'; // Assuming supabase client is here
import { format } from 'date-fns'; // For date formatting
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input'; // Import Input
import { QrScanner } from '../../components/qr-scanner/qr-scanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../../components/ui/dialog'; // Import Dialog components
import { Combobox } from '@/components/ui/combobox'; // Import Combobox
import { voidPalletAction } from './actions'; // Import server action (will be created later)

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
        const palletNotFoundMsg = `Pallet : ${searchedValueDisplay} Not Found. Please Check Again - ${formattedTime}`;
        toast.error(palletNotFoundMsg);
        await logHistory("Void Pallet Search Fail", searchedValueDisplay, null, `Pallet Not Found`);
        errorOccurred = true;
      }
    } catch (error: any) {
      console.error('Error searching pallet:', error);
      const searchErrorMsg = `Error searching pallet ${searchedValueDisplay}: ${error.message} - ${formattedTime}`;
      toast.error(`Error searching pallet: ${error.message}`);
      await logHistory("Void Pallet Search Fail", searchedValueDisplay, null, `Search Error: ${error.message}`);
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
      setFoundPallet({ ...palletInfo, current_location: currentLocation });
      
      // 根據需要在此處添加更多邏輯，例如檢查是否已 void
      if (currentLocation === 'Voided') {
          const alreadyVoidMsg = `Pallet : ${palletInfo.plt_num} Is Already Voided - ${formattedTime}`;
          toast.info(alreadyVoidMsg);
      } else {
          const foundMsg = `Pallet : ${palletInfo.plt_num} Found at location ${currentLocation || 'N/A'}. Ready to Void. - ${formattedTime}`;
          console.log(foundMsg);
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
      if (isLoading) return;
      setLastActiveInput(inputType);
      if (inputType === 'series' && seriesInput.trim()) {
        const isLikelySeries = seriesInput.includes('-') && seriesInput.length > 10; // Basic heuristic
        if (isLikelySeries) {
          handleSearch('series', seriesInput.trim());
        } else {
          handleSearch('pallet_num', seriesInput.trim()); // Assume as pallet num if not like series
        }
      } else if (inputType === 'pallet_num' && palletNumInput.trim()) {
        handleSearch('pallet_num', palletNumInput.trim());
      }
    }
  };
  
  useEffect(() => {
    // Auto-focus logic after search/action
    if (!isLoading && !isVoiding) {
      if (lastActiveInput === 'series' && seriesInputRef.current) {
        seriesInputRef.current.focus();
      } else if (lastActiveInput === 'pallet_num' && palletNumInputRef.current) {
        palletNumInputRef.current.focus();
      }
    }
  }, [isLoading, isVoiding]);

  // Handle Void Pallet action
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
            const successMsg = `Pallet ${foundPallet.plt_num} voided successfully. Reason: ${voidReason.trim()} - ${formattedTime}`;
            resetState(); // Reset everything on success
            setIsVoidDialogOpen(false); // Close dialog
        } else {
            toast.error(result.error || 'Failed to void pallet.');
            // Keep dialog open on error for correction
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

  const handleCancelVoid = () => {
    setIsVoidDialogOpen(false);
    // Clear search inputs as requested
    resetInputFields(); 
    setFoundPallet(null); // Also clear found pallet info
  };

  return (
    <div className="pl-12 pt-16 min-h-screen bg-[#232532]">
      <Toaster 
        richColors 
        position="top-right" 
        toastOptions={{
          classNames: {
            toast: 'text-xl p-6',
            title: 'text-xl',
            description: 'text-lg',
          },
        }}
      />
      <div className="flex flex-col w-full max-w-6xl ml-0 px-0">
        <div className="flex items-center mb-12 mt-2">
          <h1 className="text-3xl font-bold text-orange-400" style={{letterSpacing: 1}}>Void Pallet</h1>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-12 w-full">
            {/* Left side: Series input */}
            <div className="flex items-center w-full sm:w-1/2 max-w-xl">
              <label htmlFor="series" className="text-lg text-white font-semibold mr-4 min-w-[90px] text-right">QR Code</label>
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
                placeholder={isMobile ? "Tap To Void" : "Scan/Input Series To Void"}
                className={
                  `flex-1 px-4 py-3 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg ` +
                  (isMobile ? 'cursor-pointer select-none' : '')
                }
                disabled={isLoading}
                ref={seriesInputRef}
                {...(isMobile ? { readOnly: true, onClick: () => setShowScanner(true) } : {})}
              />
            </div>
            {/* Right side: Pallet Number input */}
            <div className="flex items-center w-full sm:w-1/2 max-w-xl mt-4 sm:mt-0">
              <label htmlFor="palletNum" className="text-lg text-white font-semibold mr-4 min-w-[130px] text-right">Pallet Number</label>
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
                placeholder="Input Pallet Number To Void"
                className="flex-1 px-4 py-3 rounded-md bg-gray-900 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                disabled={isLoading}
                ref={palletNumInputRef}
              />
            </div>
          </div>

          {foundPallet && (
            <div className="mt-6 p-4 bg-gray-800 rounded-md">
              <h3 className="text-xl font-semibold text-orange-300 mb-2">Pallet Information</h3>
              <p className="text-white text-lg"><strong>Pallet Number:</strong> {foundPallet.plt_num}</p>
              <p className="text-white text-lg"><strong>Series:</strong> {foundPallet.series}</p>
              <p className="text-white text-lg"><strong>Product Code:</strong> {foundPallet.product_code}</p>
              <p className="text-white text-lg"><strong>Quantity:</strong> {foundPallet.product_qty}</p>
              <p className="text-white text-lg"><strong>Current Location:</strong> {foundPallet.current_location || 'N/A'}</p>
              <p className="text-white text-lg"><strong>Remark:</strong> {foundPallet.plt_remark || 'None'}</p>
              {/* Conditionally render Void Pallet Button */}
              {foundPallet.current_location !== 'Voided' && (
                 <Button 
                    onClick={() => {
                        setPasswordInput(''); // Clear password on dialog open
                        setVoidReason(''); // Clear reason on dialog open
                        setIsVoidDialogOpen(true);
                    }}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                    disabled={isLoading || isVoiding} // Disable if searching or voiding
                >
                    Void Pallet
                </Button>
              )}
            </div>
          )}

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
              <p className="mt-2 text-orange-300">Processing...</p>
            </div>
          )}

          {/* Void Confirmation Dialog */}
          <Dialog open={isVoidDialogOpen} onOpenChange={ (open) => {
              if (!open) { // Handle closing via 'X' or overlay click
                  handleCancelVoid();
              } else {
                  setIsVoidDialogOpen(true);
              }
          }}>
              <DialogContent className="sm:max-w-lg bg-gray-800 border-gray-700 text-white p-8">
                  <DialogHeader>
                      <DialogTitle className="text-orange-400 text-2xl">Confirm Void Pallet</DialogTitle>
                      <DialogDescription className="text-gray-300 text-lg">
                          Select a reason and enter your password to confirm voiding pallet : <strong>{foundPallet?.plt_num}</strong>
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="reason" className="text-right text-gray-300 text-lg">
                              Reason
                          </label>
                          <Combobox
                                className="col-span-3"
                                triggerClassName="box-border bg-gray-800 text-white border-0 hover:bg-gray-700 hover:border-transparent hover:outline-none hover:ring-0 data-[state=open]:bg-gray-700 data-[state=open]:border-transparent data-[state=open]:outline-none data-[state=open]:ring-0 w-full justify-between text-lg p-2"
                                contentClassName=""
                                items={VOID_REASONS}
                                value={voidReason}
                                onValueChange={setVoidReason}
                                placeholder="Select Or Type In Reason"
                                allowCustomValue={true}
                           />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="password" className="text-right text-gray-300 text-lg">
                              Password
                          </label>
                          <Input
                              id="password"
                              type="password"
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              className="col-span-3 w-full box-border bg-gray-900 border-gray-600 placeholder-gray-500 focus:ring-blue-500 text-lg p-2"
                              disabled={isVoiding}
                          />
                      </div>
                  </div>
                  <DialogFooter className="mt-4">
                      <Button 
                        variant="outline" 
                        onClick={handleCancelVoid} 
                        disabled={isVoiding}
                        className="text-black border-gray-600 hover:bg-gray-300 hover:text-black text-lg p-3"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        onClick={handleVoidConfirm} 
                        disabled={isVoiding || !voidReason || !passwordInput}
                        className="bg-red-600 hover:bg-red-700 text-lg p-3"
                      >
                        {isVoiding ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Voiding...</>
                        ) : (
                            'Confirm Void'
                        )}
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>

          <QrScanner
            open={showScanner}
            onClose={() => setShowScanner(false)}
            onScan={(result) => {
              setSeriesInput(result);
              setLastActiveInput('series');
              setShowScanner(false);
              handleSearch('series', result);
            }}
            title="Scan QR Code"
            hint="Align the QR code within the frame"
          />
        </div>
      </div>
    </div>
  );
} 