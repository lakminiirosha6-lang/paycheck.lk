import React from 'react';
import { User } from 'firebase/auth';
import { TRANSLATIONS } from '../constants/translations';
import { Language } from '../types';
import { ShieldCheck, Globe, LogOut, FileSpreadsheet, Github, Download, Bot } from 'lucide-react';

import { ReceiptLogo } from './ReceiptLogo';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  currentUser: User | null;
  onSignInClick: () => void;
  onSignOutClick: () => void;
  onOpenGithubGuide: () => void;
  onOpenSheetsModal: () => void;
  onOpenWhatsAppAiModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  currentUser,
  onSignInClick,
  onSignOutClick,
  onOpenGithubGuide,
  onOpenSheetsModal,
  onOpenWhatsAppAiModal,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center drop-shadow-sm transition-transform hover:scale-105">
              <ReceiptLogo className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  PayCheck<span className="text-emerald-600 dark:text-emerald-400">.lk</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  🇱🇰 Sri Lanka Bank OCR
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('si')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors font-sinhala ${
                  lang === 'si'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                සිංහල
              </button>
            </div>

            {/* WhatsApp AI Auto-Reply & Dispatcher */}
            <button
              type="button"
              onClick={onOpenWhatsAppAiModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-sm shadow-green-600/20 transition-all hover:scale-105"
              title="WhatsApp AI Auto-Responder & Customer Dispatcher"
            >
              <Bot className="w-4 h-4" />
              <span>WhatsApp AI</span>
            </button>

            {/* Google Sheets Action Button */}
            <button
              type="button"
              onClick={onOpenSheetsModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors"
              title="Google Sheets Sync"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Google Sheets</span>
            </button>

            {/* Google Sign In / Account Status */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-1">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={onSignOutClick}
                  className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                  title={t.googleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignInClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs"
              >
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
                <span className="hidden sm:inline">{t.googleSignIn}</span>
              </button>
            )}

            {/* Download Project ZIP */}
            <a
              href="/paycheck-lk-project.zip"
              download="paycheck-lk-project.zip"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-emerald-800 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-950/80 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-800 transition-colors"
              title="Download all files as ZIP"
            >
              <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              <span className="hidden sm:inline">Download ZIP</span>
            </a>

            {/* GitHub Publish Guide Trigger */}
            <button
              type="button"
              onClick={onOpenGithubGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="GitHub Deployment Guide"
            >
              <Github className="w-4 h-4 text-slate-900 dark:text-slate-100" />
              <span className="hidden lg:inline">{t.githubPublish}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
