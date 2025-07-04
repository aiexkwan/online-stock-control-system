import { TestPrintingFixes } from '@/app/components/qc-label-form/TestPrintingFixes';
import { TestHardwareButton } from '@/app/components/qc-label-form/TestHardwareButton';

export default function TestHardwareFixesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Hardware Service Testing - Print Fixes</h1>
      
      <div className="space-y-8">
        {/* Basic hardware test */}
        <div>
          <TestHardwareButton />
        </div>
        
        {/* Print fixes test */}
        <TestPrintingFixes />
      </div>
    </div>
  );
}