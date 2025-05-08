import LabelHtmlTemplate from '@/components/print-label-pdf/LabelHtmlTemplate';

export default function HtmlPreviewPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <LabelHtmlTemplate
        productCode="ME4545150"
        description="Easy Stack 4 Full Wedges (300mm)"
        quantity={77}
        date="08-May-2025"
        operatorClockNum="5500"
        qcClockNum="5997"
        workOrderNumber="ACO Ref Order: 123456 1st PLT"
        palletNum="080525/17"
        qrValue="ME4545150-080525/17"
      />
    </div>
  );
} 