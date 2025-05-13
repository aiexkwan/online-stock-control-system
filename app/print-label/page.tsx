import QcLabelForm from '../components/print-label-menu/QcLabelForm';
// import ReviewTemplate from '../components/print-label-pdf/ReviewTemplate';
// import PdfPreview from '../components/print-label-pdf/PdfPreview';

export default function PrintLabelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl flex justify-center">
        <QcLabelForm />
        {/* <div className="flex-1">
          <h2 className="text-xl font-bold mb-4 text-white">PDF Preview</h2>
          <ReviewTemplate />
          <div className="mt-8">
            <PdfPreview />
          </div>
        </div> */}
      </div>
    </div>
  );
}