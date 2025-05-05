import QcLabelForm from '../components/print-label-menu/QcLabelForm';

export default function PrintLabelPage() {
  return (
    <div className="pl-8 pt-10 min-h-screen flex flex-col items-start">
      <div className="flex flex-row gap-12 items-start justify-center w-full max-w-4xl">
        <QcLabelForm />
      </div>
    </div>
  );
}