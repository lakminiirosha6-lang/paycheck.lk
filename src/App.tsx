import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  ExtractedFields,
  Language,
  ReceiptRecord,
} from './types';
import { TRANSLATIONS } from './constants/translations';
import { SampleReceipt } from './constants/banks';
import {
  getStoredLanguage,
  setStoredLanguage,
  getStoredReceipts,
  saveReceiptsToStorage,
  exportReceiptsToCSV,
} from './services/storage';
import { initAuth, logout } from './services/auth';
import { runReceiptOCR } from './services/ocr';
import { extractReceiptFields } from './services/extractor';
import { shareOnWhatsApp } from './services/whatsapp';

import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { DropZone } from './components/DropZone';
import { ReceiptEditor } from './components/ReceiptEditor';
import { ReceiptsTable } from './components/ReceiptsTable';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { GitHubGuideModal } from './components/GitHubGuideModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { WhatsAppAiModal } from './components/WhatsAppAiModal';

import {
  Loader2,
  FileSpreadsheet,
  Download,
  Github,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Sparkles,
  UserX,
  MessageSquare,
  Send,
} from 'lucide-react';
import { getExcludedContacts } from './services/whatsappAi';

export default function App() {
  const [lang, setLang] = useState<Language>(getStoredLanguage);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>(getStoredReceipts);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // OCR Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<{ status: string; progress: number }>({
    status: '',
    progress: 0,
  });

  // Active Verification / Editor State
  const [activeEditorData, setActiveEditorData] = useState<{
    extracted: ExtractedFields;
    previewUrl?: string;
    fileName: string;
    fileSize: number;
  } | null>(null);

  // Modals
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isWhatsAppAiModalOpen, setIsWhatsAppAiModalOpen] = useState(false);
  const [whatsAppModalReceipt, setWhatsAppModalReceipt] = useState<ReceiptRecord | null>(null);
  const [previewImageReceipt, setPreviewImageReceipt] = useState<ReceiptRecord | null>(null);
  const [justSavedReceipt, setJustSavedReceipt] = useState<ReceiptRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Save receipts to localStorage whenever updated
  useEffect(() => {
    saveReceiptsToStorage(receipts);
  }, [receipts]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setStoredLanguage(newLang);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle uploaded file OCR
  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setOcrProgress({ status: 'Starting OCR engine...', progress: 0.05 });

    try {
      const ocrResult = await runReceiptOCR(file, (p) => {
        setOcrProgress(p);
      });

      const extracted = extractReceiptFields(ocrResult.text, ocrResult.confidence);

      setActiveEditorData({
        extracted,
        previewUrl: ocrResult.previewUrl,
        fileName: file.name,
        fileSize: file.size,
      });

      showToast(`Extracted slip: ${extracted.bankName} - Rs. ${extracted.amountFormatted || '0'}`);
    } catch (err: any) {
      console.error('OCR Process failed:', err);
      showToast(err.message || t.ocrFailed);
    } finally {
      setIsProcessing(false);
      setOcrProgress({ status: '', progress: 0 });
    }
  };

  // Handle instant test sample receipt
  const handleSampleSelected = (sample: SampleReceipt) => {
    const extracted = extractReceiptFields(sample.sampleText, 98);
    setActiveEditorData({
      extracted,
      previewUrl: undefined,
      fileName: sample.fileName,
      fileSize: 120000,
    });
    showToast(`Loaded sample slip: ${extracted.bankName}`);
  };

  // Save verified receipt
  const handleSaveReceipt = (record: ReceiptRecord) => {
    setReceipts((prev) => [record, ...prev]);
    setActiveEditorData(null);
    setJustSavedReceipt(record);
    showToast(`Saved ${record.bankName} slip to verified table!`);
  };

  // Delete a receipt
  const handleDeleteReceipt = (id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    showToast('Receipt deleted.');
  };

  // Edit existing receipt
  const handleEditReceipt = (record: ReceiptRecord) => {
    const extracted: ExtractedFields = {
      bankId: record.bankId,
      bankName: record.bankName,
      amount: record.amount,
      amountFormatted: record.amountFormatted,
      currency: record.currency,
      date: record.date,
      time: record.time || '',
      refNumber: record.refNumber,
      senderAccount: record.senderAccount || '',
      senderName: record.senderName || '',
      beneficiaryAccount: record.beneficiaryAccount || '',
      beneficiaryName: record.beneficiaryName || '',
      confidence: record.confidence,
      rawText: record.rawOcrText,
      detectedFieldsCount: 5,
    };

    // Remove old record and open in editor
    setReceipts((prev) => prev.filter((r) => r.id !== record.id));
    setActiveEditorData({
      extracted,
      previewUrl: record.imagePreviewUrl,
      fileName: record.fileName,
      fileSize: record.fileSize,
    });
  };

  // Clear all receipts
  const handleClearAll = () => {
    if (confirm(t.confirmClearAll)) {
      setReceipts([]);
      showToast('All receipts cleared.');
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    showToast('Signed out from Google account.');
  };

  // Download standalone single-file edition
  const handleDownloadStandalone = () => {
    window.open('/single-file/index.html', '_blank');
  };

  const handleOpenWhatsAppAi = (receipt?: ReceiptRecord | null) => {
    setWhatsAppModalReceipt(receipt || null);
    setIsWhatsAppAiModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Header
        lang={lang}
        onLanguageChange={handleLanguageChange}
        currentUser={currentUser}
        onSignInClick={() => setIsSheetsModalOpen(true)}
        onSignOutClick={handleSignOut}
        onOpenGithubGuide={() => setIsGithubModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenWhatsAppAiModal={() => handleOpenWhatsAppAi(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span>🇱🇰 Sri Lanka Banking System OCR Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {lang === 'si'
              ? 'ශ්‍රී ලංකා බැංකු රිසිට්පත් ස්වයංක්‍රීය සත්‍යාපකය'
              : 'Sri Lankan Bank Receipt Verifier'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {t.subtitle}
          </p>
        </div>

        {/* WhatsApp Verification Share Banner */}
        {justSavedReceipt && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/60 dark:to-emerald-950/60 border border-green-300 dark:border-green-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-green-600/30 flex-shrink-0">
                ✓
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-green-950 dark:text-green-100">
                  {lang === 'si' ? 'රිසිට්පත තහවුරු කර සුරකින ලදී!' : 'Receipt Verified & Saved Successfully!'}
                </p>
                <p className="text-xs text-green-800 dark:text-green-300 font-medium">
                  {justSavedReceipt.bankName} • Rs. {justSavedReceipt.amountFormatted} • Ref: {justSavedReceipt.refNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleOpenWhatsAppAi(justSavedReceipt)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700 font-bold text-xs shadow-xs hover:bg-green-50 dark:hover:bg-slate-700 transition-colors"
                title="Customize with Gemini AI & Auto-Reply"
              >
                <Bot className="w-4 h-4 text-green-600" />
                <span>{lang === 'si' ? 'AI පණිවිඩය සකසන්න' : 'Draft AI Message'}</span>
              </button>
              <button
                type="button"
                onClick={() => shareOnWhatsApp(justSavedReceipt)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-green-600/20 transition-all hover:scale-105"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c.969.529 1.942.809 2.805.809 3.182 0 5.768-2.586 5.768-5.766 0-3.18-2.586-5.766-5.767-5.766zm3.385 8.168c-.145.409-.844.757-1.157.781-.314.024-.627.086-2.049-.496-1.704-.696-2.793-2.457-2.879-2.571-.086-.115-.694-.925-.694-1.765s.44-1.25.597-1.42c.157-.17.343-.213.457-.213.114 0 .229.002.329.006.105.005.245-.04.383.292.144.343.491 1.203.535 1.289.043.086.072.186.014.3-.057.115-.086.186-.171.286-.086.1-.182.224-.26.301-.086.086-.176.18-.076.352.1.171.444.733.953 1.186.655.584 1.207.765 1.378.851.171.086.271.072.371-.043.1-.115.428-.499.542-.67.114-.171.229-.143.385-.086.157.057.994.469 1.165.555.171.086.286.128.329.2.043.071.043.414-.102.823z" />
                </svg>
                <span>Share on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setJustSavedReceipt(null)}
                className="p-2 text-green-700 hover:text-green-950 dark:text-green-300 dark:hover:text-white rounded-lg transition-colors"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Quick Summary Cards */}
        <StatsOverview receipts={receipts} lang={lang} />

        {/* WhatsApp AI Auto-Reply & Customer Assistant Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-green-950/40 border border-emerald-200 dark:border-emerald-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold shadow-md shadow-green-600/30 flex-shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'si' ? 'WhatsApp AI සහකරු & Auto-Reply පද්ධතිය' : 'WhatsApp AI Assistant & Auto-Reply Hub'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300 border border-green-300 dark:border-green-700">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {lang === 'si'
                  ? 'මම කියන විදියට AI මගින් WhatsApp මැසේජ් යැවීම, Customer Auto-Reply සහ Exclude ලැයිස්තුව කළමනාකරණය'
                  : 'Automated AI customer messaging, smart query auto-replies, and selective contact exclusion'}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleOpenWhatsAppAi(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
            >
              <UserX className="w-3.5 h-3.5 text-rose-500" />
              <span>{lang === 'si' ? 'Exclude List (Reply නවත්වන්න)' : 'Exclude List'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenWhatsAppAi(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-green-600/20 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>{lang === 'si' ? 'AI WhatsApp විවෘත කරන්න' : 'Open WhatsApp AI'}</span>
            </button>
          </div>
        </div>

        {/* OCR Progress Overlay */}
        {isProcessing && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 shadow-xl max-w-md mx-auto text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.analyzingReceipt}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {ocrProgress.status || t.stepExtracting}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(ocrProgress.progress * 100)}%` }}
              />
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300">
              {Math.round(ocrProgress.progress * 100)}%
            </div>
          </div>
        )}

        {/* Dropzone for Receipt Upload */}
        {!activeEditorData && (
          <DropZone
            lang={lang}
            onFileSelected={handleFileSelected}
            onSampleSelected={handleSampleSelected}
            isProcessing={isProcessing}
          />
        )}

        {/* Verification & Field Editor */}
        {activeEditorData && (
          <ReceiptEditor
            lang={lang}
            extracted={activeEditorData.extracted}
            previewUrl={activeEditorData.previewUrl}
            fileName={activeEditorData.fileName}
            fileSize={activeEditorData.fileSize}
            existingReceipts={receipts}
            onSave={handleSaveReceipt}
            onCancel={() => setActiveEditorData(null)}
          />
        )}

        {/* Verified Receipts Table */}
        <ReceiptsTable
          receipts={receipts}
          lang={lang}
          onEditReceipt={handleEditReceipt}
          onDeleteReceipt={handleDeleteReceipt}
          onClearAll={handleClearAll}
          onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
          onViewImage={(rec) => setPreviewImageReceipt(rec)}
          onOpenWhatsAppAiForReceipt={(rec) => handleOpenWhatsAppAi(rec)}
        />

        {/* Bottom Quick Tools Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-base font-bold flex items-center gap-2 justify-center md:justify-start">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Ready for Production Deployment</span>
            </h4>
            <p className="text-xs text-emerald-100 max-w-xl">
              PayCheck.lk is configured with GitHub Actions workflow for automatic deployment to GitHub Pages. All receipt processing runs client-side in the browser.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenWhatsAppAi(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold text-xs sm:text-sm hover:bg-green-700 transition-colors shadow-sm"
            >
              <Bot className="w-4 h-4" />
              <span>WhatsApp AI Hub</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGithubModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <Github className="w-4 h-4" />
              <span>Publish to GitHub</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadStandalone}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-800 text-white hover:bg-emerald-700 font-semibold text-xs sm:text-sm border border-emerald-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Standalone HTML</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-12 text-center text-xs text-slate-500">
        <p>
          PayCheck.lk • Sri Lankan Bank Receipt OCR Verifier • Commercial Bank, BOC, Sampath, NSB, People's & HNB
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Client-side Tesseract.js & PDF.js • Google Workspace Integration • LocalStorage Persistence • Gemini AI WhatsApp Assistant
        </p>
      </footer>

      {/* WhatsApp AI Auto-Responder Modal */}
      <WhatsAppAiModal
        isOpen={isWhatsAppAiModalOpen}
        onClose={() => setIsWhatsAppAiModalOpen(false)}
        receipts={receipts}
        selectedReceipt={whatsAppModalReceipt}
        lang={lang}
      />

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        receipts={receipts}
        currentUser={currentUser}
        onUserChanged={(u) => setCurrentUser(u)}
        lang={lang}
      />

      {/* GitHub Guide Modal */}
      <GitHubGuideModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />

      {/* Receipt Image Preview Modal */}
      <ImagePreviewModal
        receipt={previewImageReceipt}
        onClose={() => setPreviewImageReceipt(null)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-medium shadow-2xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
