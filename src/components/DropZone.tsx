import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Sparkles, Building2, AlertCircle } from 'lucide-react';
import { TRANSLATIONS } from '../constants/translations';
import { Language } from '../types';
import { SUPPORTED_BANKS, SAMPLE_RECEIPTS, SampleReceipt } from '../constants/banks';

interface DropZoneProps {
  lang: Language;
  onFileSelected: (file: File) => void;
  onSampleSelected: (sample: SampleReceipt) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  lang,
  onFileSelected,
  onSampleSelected,
  isProcessing,
}) => {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    setErrorMessage(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!validTypes.includes(file.type) && !isPdf && !isImage) {
      setErrorMessage(t.fileError);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit. Please upload a smaller receipt slip.');
      return;
    }

    onFileSelected(file);
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all cursor-pointer select-none ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-slate-50/60 dark:hover:bg-slate-800'
        } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.webp"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${
              isDragOver
                ? 'bg-emerald-600 text-white scale-110'
                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
            {isDragOver ? t.dragOverMsg : t.uploadTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
            {t.uploadSubtitle}
          </p>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors">
              <FileText className="w-4 h-4" />
              {t.chooseFile}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono">JPG</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono">PNG</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono">PDF</span>
            <span>• Max 15MB</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Supported Bank Pills */}
      <div className="bg-slate-100/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.supportedBanksHeading}:</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Optimized Sri Lankan Regex & Layout OCR
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {Object.values(SUPPORTED_BANKS)
            .filter((b) => b.id !== 'other')
            .map((b) => (
              <div
                key={b.id}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-transform hover:scale-[1.02] ${b.badgeBg} ${b.badgeText}`}
              >
                <span className="text-xs font-black tracking-wider">{b.code}</span>
                <span className="text-[11px] font-medium opacity-90 line-clamp-1 mt-0.5">
                  {lang === 'si' ? b.nameSi : b.nameEn}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Instant Demo / Sample Receipts */}
      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t.trySampleReceipt}:</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
          Don't have a slip right now? Click any Sri Lankan bank slip below to instantly test auto-extraction:
        </p>

        <div className="flex flex-wrap gap-2">
          {SAMPLE_RECEIPTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={isProcessing}
              onClick={() => onSampleSelected(sample)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 shadow-2xs transition-all disabled:opacity-50"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{lang === 'si' ? sample.titleSi : sample.titleEn}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
