'use client';

import React, { useState, useEffect } from 'react';
import { exportAcoReport } from '../../lib/exportReport';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'; // Shadcn Select component - currently missing
import { getUniqueAcoOrderRefs, getAcoReportData } from '../actions/reportActions';

export default function ExportReportPage() {
  const [showAcoRefDialog, setShowAcoRefDialog] = useState(false);
  const [acoOrderRefs, setAcoOrderRefs] = useState<string[]>([]);
  const [selectedAcoOrderRef, setSelectedAcoOrderRef] = useState<string | undefined>(
    undefined
  );
  const [isLoadingOrderRefs, setIsLoadingOrderRefs] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (showAcoRefDialog && acoOrderRefs.length === 0 && !isLoadingOrderRefs) {
      setIsLoadingOrderRefs(true);
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
          alert('Failed to load ACO Order References. Please try again.');
          setAcoOrderRefs([]);
          setSelectedAcoOrderRef(undefined);
        })
        .finally(() => {
          setIsLoadingOrderRefs(false);
        });
    }
  }, [showAcoRefDialog, acoOrderRefs.length, isLoadingOrderRefs]);

  const handleAcoExportClick = () => {
    setSelectedAcoOrderRef(undefined);
    setShowAcoRefDialog(true);
  };

  const handleConfirmAcoExport = async () => {
    if (!selectedAcoOrderRef) {
      alert('Please select an ACO Order Ref.');
      return;
    }

    setIsExporting(true);
    try {
      const reportData = await getAcoReportData(selectedAcoOrderRef);
      if (reportData && reportData.length > 0) {
        await exportAcoReport(reportData, selectedAcoOrderRef);
      } else {
        alert('No data found for the selected ACO Order Ref to generate the report.');
      }
    } catch (error) {
      console.error('Error during report export process:', error);
      alert('An error occurred while exporting the report. Please try again.');
    } finally {
      setIsExporting(false);
      setShowAcoRefDialog(false);
    }
  };

  const handleCancelAcoExport = () => {
    if (isExporting) return;
    setShowAcoRefDialog(false);
  };

  const handleNativeSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAcoOrderRef(event.target.value || undefined);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8 text-center text-orange-500">
        Export Reports
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={handleAcoExportClick}
          disabled={isExporting}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting && showAcoRefDialog ? 'Exporting...' : 'ACO Order Report'}
        </button>
        <button
          onClick={() => alert('Exporting Slate Report...')}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
        >
          Slate Report
        </button>
        <button
          onClick={() => alert('Exporting GRN Report...')}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
        >
          GRN Report
        </button>
        <button
          onClick={() => alert('Exporting Transaction Report...')}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105"
        >
          Transaction Report
        </button>
      </div>

      <Dialog open={showAcoRefDialog} onOpenChange={(open) => !isExporting && setShowAcoRefDialog(open)}>
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Select ACO Order Ref</DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Please select an ACO Order Reference from the list below to generate the report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isLoadingOrderRefs ? (
              <p className="text-center">Loading references...</p>
            ) : acoOrderRefs.length > 0 ? (
              <select
                value={selectedAcoOrderRef || ''}
                onChange={handleNativeSelectChange}
                disabled={isExporting}
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
              // TODO: Replace with Shadcn Select component when available
              // <Select onValueChange={setSelectedAcoOrderRef} value={selectedAcoOrderRef}>
              //   <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 focus:ring-blue-500">
              //     <SelectValue placeholder="Select an ACO Order Ref" />
              //   </SelectTrigger>
              //   <SelectContent className="bg-gray-800 text-white border-gray-700">
              //     {acoOrderRefs.map((ref) => (
              //       <SelectItem
              //         key={ref}
              //         value={ref}
              //         className="cursor-pointer hover:bg-gray-700 data-[highlighted]:bg-gray-700 data-[state=checked]:bg-blue-600"
              //       >
              //         {ref}
              //       </SelectItem>
              //     ))}
              //   </SelectContent>
              // </Select>
            ) : (
              <p className="text-center">No ACO Order References found or failed to load.</p>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              onClick={handleCancelAcoExport}
              variant="outline"
              disabled={isExporting}
              className="bg-gray-600 hover:bg-gray-500 text-white border-gray-500 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAcoExport}
              disabled={!selectedAcoOrderRef || isLoadingOrderRefs || isExporting}
              className="bg-blue-500 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Confirm Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 