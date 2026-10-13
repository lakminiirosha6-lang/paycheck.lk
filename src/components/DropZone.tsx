import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Building2,
  AlertCircle,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { TRANSLATIONS } from '../constants/translations';
import { Language } from '../types';
import { SUPPORTED_BANKS, SAMPLE_RECEIPTS, SampleReceipt } from '../constants/banks';

interface DropZoneProps {
  lang: Language;
  onFileSelected: (file: File) => void;
  onSampleSelected: (sample: SampleReceipt) => void;
  onTextSubmitted?: (text: string, title?: string) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  lang,
  onFileSelected,
  onSampleSelected,
  onTextSubmitted,
  isProcessing,
}) => {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'sms'>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastedSmsText, setPastedSmsText] = useState('');

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

  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedSmsText.trim()) {
      setErrorMessage('Please paste or type an SMS message to verify.');
      return;
    }
    setErrorMessage(null);
    if (onTextSubmitted) {
      onTextSubmitted(pastedSmsText.trim(), 'eZ Cash / SMS Slip');
    }
  };

  const quickSmsSamples = [
    {
      label: 'eZ Cash SMS 1 (Rs. 1,400)',
      text: `Mudal yaweema Geweema: 778459896 13/10/2026 19:03 Rs.1400.00 Current Balance: Rs.68.00 sewa gasthuwa: Rs.0.00 Shuddha geweema: Rs.1400.00 RN:20261013235486`,
    },
    {
      label: 'eZ Cash SMS 2 (Rs. 1,380)',
      text: `Rs.1468.00 Sewa gasthu: Rs.20.00 Labunu mudala: Rs.1380.00 RN:20261013140995`,
    },
    {
      label: 'eZ Cash App (Rs. 1,200)',
      text: `Transaction Successful
Total Amount Rs. 1,200.00
Payment Method eZ Cash 768303937
Mobile Number 077 845 9896
Date and Time 06/10/2026 | 2:56 PM
Transaction ID 179127879010231626`,
    },
    {
      label: 'POS Thermal (Rs. 600)',
      text: `BEST MOBILE NITTAMBUWA
Date: 2026:10:02 Time: 14:02
Dialog EZ send money
Number: 0763461254
Amount: 600
Thank You`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Upload File vs Paste SMS */}
      <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-md mx-auto border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'upload'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>{lang === 'si' ? 'ස්ලිප් / පින්තූරය Upload' : 'Upload Slip / Photo'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('sms');
            setErrorMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'sms'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>{lang === 'si' ? 'eZ Cash / SMS Paste' : 'eZ Cash / SMS Paste'}</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500 text-white font-extrabold uppercase tracking-wide">
            New
          </span>
        </button>
      </div>

      {activeTab === 'upload' ? (
        /* Upload Box */
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
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2">
              {t.uploadSubtitle}
            </p>
            <p className="text-[12px] font-medium text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {lang === 'si'
                  ? 'eZ Cash SMS Screen Shots, Dialog ඇප් රිසිට්පත් සහ කඩේ මුද්‍රිත බිල්පත්ද සත්‍යාපනය කළ හැක'
                  : 'Supports eZ Cash SMS Screenshots, MyDialog App Receipts & POS Thermal Slips'}
              </span>
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
      ) : (
        /* SMS Paste Area */
        <div className="rounded-2xl border-2 border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <form onSubmit={handleSmsSubmit} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'si'
                      ? 'eZ Cash / SMS පණිවිඩය කෙලින්ම Paste කරන්න'
                      : 'Directly Paste eZ Cash / SMS Payment Text'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'si'
                      ? 'WhatsApp හෝ SMS වලින් ලැබුණු පණිවිඩය මෙතැනට Paste කර තත්පරයකින් තහවුරු කරන්න'
                      : 'Paste the SMS forward or transaction message to extract RN reference, amount, and phone'}
                  </p>
                </div>
              </div>
            </div>

            <textarea
              rows={4}
              value={pastedSmsText}
              onChange={(e) => setPastedSmsText(e.target.value)}
              placeholder={
                lang === 'si'
                  ? 'උදාහරණ: Mudal yaweema Geweema: 778459896 13/10/2026 19:03 Rs.1400.00 Current Balance: Rs.68.00 sewa gasthuwa: Rs.0.00 Shuddha geweema: Rs.1400.00 RN:20261013235486'
                  : 'e.g. Mudal yaweema Geweema: 778459896 13/10/2026 19:03 Rs.1400.00 Current Balance: Rs.68.00 sewa gasthuwa: Rs.0.00 Shuddha geweema: Rs.1400.00 RN:20261013235486'
              }
              className="w-full p-3 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
            />

            {/* Quick Test Samples */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {lang === 'si' ? 'ක්ෂණිකව පරීක්ෂා කිරීමට ක්ලික් කරන්න:' : 'Click to load quick test sample:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickSmsSamples.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPastedSmsText(sample.text)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPastedSmsText('')}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!pastedSmsText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-sm transition-all"
              >
                <span>{lang === 'si' ? 'තහවුරු කර දත්ත ලබාගන්න' : 'Extract & Verify Slip'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Supported Bank Pills */}
      <div className="bg-slate-100/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.supportedBanksHeading}:</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'si'
              ? 'බැංකු සහ eZ Cash / mCash වොලට් සඳහා විශේෂිත OCR & Regex'
              : 'Optimized Sri Lankan Regex & Layout OCR (Banks & Mobile Wallets)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {Object.values(SUPPORTED_BANKS)
            .filter((b) => b.id !== 'other')
            .map((b) => (
              <div
                key={b.id}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-transform hover:scale-[1.02] ${b.badgeBg} ${b.badgeText}`}
              >
                <span className="text-[11px] font-black tracking-wider">{b.code}</span>
                <span className="text-[10px] font-medium opacity-90 line-clamp-1 mt-0.5">
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
          {lang === 'si'
            ? 'දැනට ස්ලිප් එකක් නැද්ද? පහත ඕනෑම බැංකු හෝ eZ Cash රිසිට්පතක් ක්ලික් කර පරීක්ෂා කර බලන්න:'
            : "Don't have a slip right now? Click any Sri Lankan bank or eZ Cash slip below to instantly test auto-extraction:"}
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
              <span
                className={`w-2 h-2 rounded-full ${
                  sample.bankId === 'ez_cash'
                    ? 'bg-rose-500'
                    : sample.bankId === 'mcash'
                    ? 'bg-teal-500'
                    : 'bg-emerald-500'
                }`}
              />
              <span>{lang === 'si' ? sample.titleSi : sample.titleEn}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
