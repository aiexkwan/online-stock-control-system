import QcLabelForm from '../components/print-label-menu/QcLabelForm';
// import ReviewTemplate from '../components/print-label-pdf/ReviewTemplate';
// import PdfPreview from '../components/print-label-pdf/PdfPreview';

export default function PrintLabelPage() {
  return (
    <div className="pl-8 pt-10 min-h-screen flex flex-col items-start">
      <div className="flex flex-row gap-12 items-start justify-center w-full max-w-4xl">
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