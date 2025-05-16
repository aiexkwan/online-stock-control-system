'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { exportAcoReport, exportGrnReport } from '../../lib/exportReport';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'; // Shadcn Select component - currently missing
import { getUniqueAcoOrderRefs, getAcoReportData, getUniqueGrnRefs, getMaterialCodesForGrnRef, getGrnReportData } from '../actions/reportActions';
import { toast } from "sonner";
// import type { Database } from '../lib/database.types'; // Assuming Database types are available if needed for client client

export default function ExportReportPage() {
  // REMOVED: const supabase = createClientComponentClient(); 

  const [showAcoRefDialog, setShowAcoRefDialog] = useState(false);
  const [acoOrderRefs, setAcoOrderRefs] = useState<string[]>([]);
  const [selectedAcoOrderRef, setSelectedAcoOrderRef] = useState<string | undefined>(
    undefined
  );
  const [isLoadingAcoOrderRefs, setIsLoadingAcoOrderRefs] = useState(false);
  const [isExportingAco, setIsExportingAco] = useState(false);

  // States for GRN Report Dialog
  const [showGrnRefDialog, setShowGrnRefDialog] = useState(false);
  const [grnRefs, setGrnRefs] = useState<string[]>([]);
  const [selectedGrnRef, setSelectedGrnRef] = useState<string | undefined>(undefined);
  const [isLoadingGrnRefs, setIsLoadingGrnRefs] = useState(false);
  const [isExportingGrn, setIsExportingGrn] = useState(false);
  
  const [isPending, startTransition] = useTransition();

  // Function to get user ID from localStorage
  const getStoredUserId = (): string | null => {
    if (typeof window !== 'undefined') { // Ensure localStorage is available
      const clockNumber = localStorage.getItem('loggedInUserClockNumber'); // Get clock number directly
      if (clockNumber) {
        return clockNumber; // Return the clock number
      }
      // Optional: Log if not found, though consuming functions should handle null
      console.warn('[ExportReportPage] loggedInUserClockNumber not found in localStorage.');
    }
    return null;
  };

  useEffect(() => {
    if (showAcoRefDialog && acoOrderRefs.length === 0 && !isLoadingAcoOrderRefs) {
      setIsLoadingAcoOrderRefs(true);
      getUniqueAcoOrderRefs()
        .then((refs) => {
          setAcoOrderRefs(refs);
          if (refs.length > 0) {
            // setSelectedAcoOrderRef(refs[0]); // Optionally auto-select first item
          } else {
            setSelectedAcoOrderRef(undefined);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch ACO order refs:', err);
          toast.error('Failed to load ACO Order References. Please try again.');
          setAcoOrderRefs([]);
          setSelectedAcoOrderRef(undefined);
        })
        .finally(() => {
          setIsLoadingAcoOrderRefs(false);
        });
    }
  }, [showAcoRefDialog, acoOrderRefs.length, isLoadingAcoOrderRefs]);

  // useEffect for fetching GRN Refs
  useEffect(() => {
    if (showGrnRefDialog && grnRefs.length === 0 && !isLoadingGrnRefs) {
      setIsLoadingGrnRefs(true);
      getUniqueGrnRefs()
        .then((refs) => {
          setGrnRefs(refs);
          if (refs.length > 0) {
            // setSelectedGrnRef(refs[0]); // Optionally auto-select first item
          } else {
            setSelectedGrnRef(undefined);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch GRN refs:', err);
          toast.error('Failed to load GRN References. Please try again.');
          setGrnRefs([]);
          setSelectedGrnRef(undefined);
        })
        .finally(() => {
          setIsLoadingGrnRefs(false);
        });
    }
  }, [showGrnRefDialog, grnRefs.length, isLoadingGrnRefs]);

  const handleAcoExportClick = () => {
    setSelectedAcoOrderRef(undefined);
    setShowAcoRefDialog(true);
  };

  const handleConfirmAcoExport = async () => {
    if (!selectedAcoOrderRef) {
      toast.warning('Please select an ACO Order Ref.');
      return;
    }

    setIsExportingAco(true);
    try {
      const reportData = await getAcoReportData(selectedAcoOrderRef);
      if (reportData && reportData.length > 0) {
        await exportAcoReport(reportData, selectedAcoOrderRef);
        toast.success(`ACO Report for ${selectedAcoOrderRef} exported successfully!`);
      } else {
        toast.info('No data found for the selected ACO Order Ref to generate the report.');
      }
    } catch (error) {
      console.error('Error during ACO report export process:', error);
      toast.error('An error occurred while exporting the ACO report. Please try again.');
    } finally {
      setIsExportingAco(false);
      setShowAcoRefDialog(false);
    }
  };

  const handleCancelAcoExport = () => {
    if (isExportingAco) return;
    setShowAcoRefDialog(false);
  };

  const handleNativeAcoSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAcoOrderRef(event.target.value || undefined);
  };

  // GRN Report Handlers
  const handleGrnReportExportClick = () => {
    setSelectedGrnRef(undefined);
    setShowGrnRefDialog(true);
  };

  const handleConfirmGrnExport = async () => {
    if (!selectedGrnRef) {
      toast.warning('Please select a GRN Ref Number.');
      return;
    }
    setIsExportingGrn(true);
    setShowGrnRefDialog(false); // Close dialog immediately

    try {
      const currentUserId = getStoredUserId();

      if (!currentUserId) {
        toast.error("User ID not found. Please ensure you are logged in and user data is available in localStorage.");
        console.error('Stored user ID not found in localStorage.');
        setIsExportingGrn(false);
        return;
      }
      
      const materialCodes = await getMaterialCodesForGrnRef(selectedGrnRef);
      if (!materialCodes || materialCodes.length === 0) {
        toast.info(`No material codes found for GRN Ref: ${selectedGrnRef}.`);
        setIsExportingGrn(false);
        return;
      }

      let exportCount = 0;
      for (const materialCode of materialCodes) {
        const reportPageData = await getGrnReportData(selectedGrnRef, materialCode, currentUserId);

        if (reportPageData) {
          await exportGrnReport(reportPageData); // exportGrnReport will need to accept this data
          toast.success(`GRN Report for ${selectedGrnRef} (Material: ${materialCode}) exported successfully!`);
          exportCount++;
        } else {
          toast.error(`Failed to generate data for GRN Report ${selectedGrnRef} (Material: ${materialCode}).`);
        }
      }
      if(exportCount === 0 && materialCodes.length > 0){
        toast.error(`Failed to export any GRN reports for GRN Ref: ${selectedGrnRef}.`);
      }

    } catch (error) {
      console.error("Error during GRN report export process:", error);
      toast.error("An error occurred while exporting GRN reports. Please try again.");
    } finally {
      setIsExportingGrn(false);
    }
  };

  const handleCancelGrnExport = () => {
    if (isExportingGrn) return;
    setShowGrnRefDialog(false);
  };

  const handleNativeGrnSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrnRef(event.target.value || undefined);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">
        Export Reports
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={handleAcoExportClick}
          disabled={isExportingAco || isExportingGrn}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExportingAco && showAcoRefDialog ? 'Exporting...' : 'ACO Order Report'}
        </button>
        <button 
          className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => console.log("Slate Report button clicked")}
          disabled
        >
          Slate Report
        </button>
        <button 
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleGrnReportExportClick}
          disabled={isExportingGrn || isExportingAco}
        >
          {isExportingGrn && showGrnRefDialog ? 'Exporting...' : 'GRN Report'}
        </button>
        <button
          onClick={() => toast.info('Transaction Report functionality not yet implemented.')}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Transaction Report
        </button>
      </div>

      <Dialog open={showAcoRefDialog} onOpenChange={(open) => !isExportingAco && setShowAcoRefDialog(open)}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Select ACO Order Ref</DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Please select an ACO Order Reference from the list below to generate the report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isLoadingAcoOrderRefs ? (
              <p className="text-center">Loading references...</p>
            ) : acoOrderRefs.length > 0 ? (
              <select
                value={selectedAcoOrderRef || ''}
                onChange={handleNativeAcoSelectChange}
                disabled={isExportingAco}
                className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  Select an ACO Order Ref
                </option>
                {acoOrderRefs.map((ref) => (
                  <option key={ref} value={ref}>
                    {ref}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-center">No ACO Order References found or failed to load.</p>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              onClick={handleCancelAcoExport}
              variant="outline"
              disabled={isExportingAco}
              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAcoExport}
              disabled={!selectedAcoOrderRef || isLoadingAcoOrderRefs || isExportingAco}
              className="bg-blue-500 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingAco ? 'Exporting...' : 'Confirm Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGrnRefDialog} onOpenChange={(open) => !isExportingGrn && setShowGrnRefDialog(open)}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Select GRN Ref Number</DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Please select a GRN Reference Number from the list below to generate the report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isLoadingGrnRefs ? (
              <p className="text-center">Loading GRN references...</p>
            ) : grnRefs.length > 0 ? (
              <select
                value={selectedGrnRef || ''}
                onChange={handleNativeGrnSelectChange}
                disabled={isExportingGrn}
                className="w-full p-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  Select a GRN Ref Number
                </option>
                {grnRefs.map((ref) => (
                  <option key={ref} value={ref}>
                    {ref}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-center">No GRN References found or failed to load.</p>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              onClick={handleCancelGrnExport}
              variant="outline"
              disabled={isExportingGrn}
              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmGrnExport}
              disabled={!selectedGrnRef || isLoadingGrnRefs || isExportingGrn}
              className="bg-green-500 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingGrn ? 'Exporting...' : 'Confirm Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 