import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { ReceiptRecord, Language } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { createAndExportToSheets, ExportResult } from '../services/googleSheets';
import { googleSignIn } from '../services/auth';
import {
  FileSpreadsheet,
  X,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: ReceiptRecord[];
  currentUser: User | null;
  onUserChanged: (user: User) => void;
  lang: Language;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  receipts,
  currentUser,
  onUserChanged,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  const defaultTitle = `PayCheck.lk - Bank Receipts (${new Date().toISOString().slice(0, 10)})`;
  const [sheetTitle, setSheetTitle] = useState(defaultTitle);
  const [isExporting, setIsExporting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onUserChanged(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate with Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleConfirmExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    try {
      const result = await createAndExportToSheets(sheetTitle, receipts);
      setExportResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message ||
          'Failed to export to Google Sheets. Please ensure spreadsheet permissions are granted.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.exportToSheetsModalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.exportToSheetsDesc}
          </p>

          {/* Authentication Status */}
          {!currentUser ? (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-center space-y-3">
              <Lock className="w-6 h-6 mx-auto text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Google Workspace Authentication Required
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sign in with Google to create spreadsheets and save your receipts.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-semibold text-xs sm:text-sm shadow-xs hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                {isSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{t.googleSignIn}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                <span>
                  {t.googleConnectedAs}{' '}
                  <strong>{currentUser.email || currentUser.displayName}</strong>
                </span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.sheetNameLabel}
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                />
              </div>

              {/* Confirmation details */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Receipts to sync:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {receipts.length} records
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Columns:</span>
                  <span>13 fields (Ref, Bank, Amount, Date, Status...)</span>
                </div>
                <div className="flex justify-between">
                  <span>Action:</span>
                  <span>Create new Google Spreadsheet & append rows</span>
                </div>
              </div>
            </div>
          )}

          {/* Success state with direct link */}
          {exportResult && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.exportSuccess}</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Created spreadsheet with {exportResult.rowsAdded} rows of verified bank receipts.
              </p>
              <a
                href={exportResult.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <span>{t.openInSheets}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {exportResult ? 'Close' : t.cancel}
          </button>
          {currentUser && !exportResult && (
            <button
              type="button"
              disabled={isExporting || receipts.length === 0}
              onClick={handleConfirmExport}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.exportingToSheets}</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export to Google Sheets</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
