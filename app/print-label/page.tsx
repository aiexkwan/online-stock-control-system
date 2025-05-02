import QcLabelForm from '../components/print-label-menu/QcLabelForm';

export default function PrintLabelPage() {
  return (
    <div className="pl-64 pt-16 min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-row gap-12 items-start justify-center w-full max-w-4xl">
        <QcLabelForm />
      </div>
    </div>
  );
} 