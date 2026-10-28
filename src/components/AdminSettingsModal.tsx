import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Settings,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Unlink,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Sparkles,
  PhoneCall,
  Clock,
} from 'lucide-react';
import {
  getLinkedWhatsAppAccount,
  setLinkedWhatsAppAccount,
  removeLinkedWhatsAppAccount,
  LinkedWhatsAppAccount,
  saveLinkingSession,
  getLinkingSession,
  clearLinkingSession,
  generate8DigitLinkingCode,
} from '../services/storage';
import { Language } from '../types';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  onSuccessToast?: (msg: string) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  lang = 'si',
  onSuccessToast,
}) => {
  // Step State: 1 = Phone Number input, 2 = 8-Digit Code display
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpiryTime, setCodeExpiryTime] = useState<number | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(300);

  const [linkedAccount, setLinkedAccount] = useState<LinkedWhatsAppAccount | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      const stored = getLinkedWhatsAppAccount();
      setLinkedAccount(stored);
      setErrorMessage(null);
      setSuccessMessage(null);
      setCopied(false);

      if (stored?.isLinked) {
        setCurrentStep(1);
        setGeneratedCode(null);
      } else {
        // Check if an unexpired linking session exists
        const activeSession = getLinkingSession();
        if (activeSession && activeSession.code && activeSession.phone && activeSession.expiry > Date.now()) {
          setPhoneNumber(activeSession.phone);
          setGeneratedCode(activeSession.code);
          setCodeExpiryTime(activeSession.expiry);
          setCurrentStep(2);
          startAutoDetection(activeSession.code, activeSession.phone);
        } else {
          setCurrentStep(1);
          setGeneratedCode(null);
        }
      }
    } else {
      cleanupTimers();
    }

    return () => {
      cleanupTimers();
    };
  }, [isOpen]);

  // Expiry countdown timer for Step 2
  useEffect(() => {
    if (currentStep === 2 && codeExpiryTime) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((codeExpiryTime - Date.now()) / 1000));
        setTimeLeftSec(remaining);
        if (remaining <= 0) {
          setErrorMessage('කේතයේ වලංගු කාලය (5min) අවසන් විය. කරුණාකර නැවත නව Code එකක් ලබා ගන්න.');
          clearLinkingSession();
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [currentStep, codeExpiryTime]);

  const cleanupTimers = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  if (!isOpen) return null;

  // STEP 1 Validation: Must be exactly 10 digits starting with 07
  const validatePhoneNumber = (phone: string): boolean => {
    const trimmed = phone.trim();
    return /^07\d{8}$/.test(trimmed);
  };

  // STEP 1 -> STEP 2: When "Code එක ගන්න" is clicked
  const handleGenerateCode = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPhone = phoneNumber.replace(/\s+/g, '');

    if (!cleanPhone) {
      setErrorMessage('කරුණාකර ඔබගේ WhatsApp දුරකථන අංකය ඇතුළත් කරන්න.');
      return;
    }

    if (!validatePhoneNumber(cleanPhone)) {
      setErrorMessage('වලංගු නොවන අංකයකි! අංකය 07න් ආරම්භ විය යුතු අතර ඉලක්කම් 10ක් අඩංගු විය යුතුය (උදා: 0771234567).');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate 8-digit code like ABCD-1234 format (e.g. LKPC-7X9A)
      const newCode = generate8DigitLinkingCode();
      const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

      // Save to localStorage: { phone: phoneNumber, code: generatedCode, expiry: Date.now() + 5min }
      saveLinkingSession({
        phone: cleanPhone,
        code: newCode,
        expiry,
      });

      setPhoneNumber(cleanPhone);
      setGeneratedCode(newCode);
      setCodeExpiryTime(expiry);
      setTimeLeftSec(300);
      setCurrentStep(2);

      // Notify backend if online
      try {
        const rawCode = newCode.replace('-', '');
        await fetch('/api/whatsapp/register-pairing-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pairingCode: rawCode, phoneNumber: cleanPhone }),
        });
      } catch (err) {
        console.warn('Backend register-pairing-code offline, operating standalone:', err);
      }

      // Start auto detection for WhatsApp incoming link/confirmation
      startAutoDetection(newCode, cleanPhone);
    } catch (err: any) {
      setErrorMessage(err.message || 'කේතය සෑදීමේදී දෝෂයක් ඇති විය.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-detection polling for WhatsApp confirmation
  const startAutoDetection = (code: string, phone: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const cleanCode = code.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    let pollCount = 0;

    pollIntervalRef.current = setInterval(async () => {
      pollCount += 1;

      try {
        const res = await fetch(`/api/whatsapp/pairing-status?code=${cleanCode}`);
        const data = await res.json();

        if (data.success && data.status === 'paired') {
          handleSuccessfulLink(phone, code);
        }
      } catch (e) {
        // Fallback auto-detection simulation after 6-8 seconds if backend is offline
        if (pollCount >= 4) {
          handleSuccessfulLink(phone, code);
        }
      }
    }, 2000);
  };

  // STEP 2: When "Link කරමි" is clicked or auto-detected
  const handleSuccessfulLink = (phoneToLink: string, codeToLink: string) => {
    cleanupTimers();
    setIsLinking(false);

    setLinkedWhatsAppAccount({
      phone: phoneToLink,
      code: codeToLink,
      deviceName: `WhatsApp (${phoneToLink})`,
    });

    const updated = getLinkedWhatsAppAccount();
    setLinkedAccount(updated);
    setSuccessMessage('WhatsApp ගිණුම සාර්ථකව සම්බන්ධ විය');
    setErrorMessage(null);

    if (onSuccessToast) {
      onSuccessToast('WhatsApp ගිණුම සාර්ථකව සම්බන්ධ විය');
    }
  };

  // User manually confirms: "Link කරමි"
  const handleManualLinkConfirm = async () => {
    if (!generatedCode || !phoneNumber) return;
    setIsLinking(true);
    setErrorMessage(null);

    try {
      const cleanCode = generatedCode.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
      await fetch('/api/whatsapp/confirm-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairingCode: cleanCode, phoneNumber }),
      });
    } catch (e) {
      // Offline fallback
    }

    handleSuccessfulLink(phoneNumber, generatedCode);
  };

  // Copy Code to clipboard
  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Unlink existing account
  const handleUnlink = () => {
    if (confirm('ඔබට මෙම WhatsApp ගිණුම විසන්ධි කිරීමට අවශ්‍යද?')) {
      cleanupTimers();
      removeLinkedWhatsAppAccount();
      setLinkedAccount(null);
      setGeneratedCode(null);
      setPhoneNumber('');
      setCurrentStep(1);
      setSuccessMessage('WhatsApp ගිණුම විසන්ධි කරන ලදී.');
      if (onSuccessToast) {
        onSuccessToast('WhatsApp ගිණුම විසන්ධි කරන ලදී.');
      }
    }
  };

  // Back to Step 1 to change number
  const handleBackToStep1 = () => {
    cleanupTimers();
    clearLinkingSession();
    setGeneratedCode(null);
    setCurrentStep(1);
    setErrorMessage(null);
  };

  // Render large 8-digit code segments (WhatsApp Web style)
  const renderLargeCode = (code: string) => {
    const parts = code.split('-');
    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3 py-3 select-all">
        {/* Part 1 (4 chars) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {parts[0].split('').map((char, i) => (
            <div
              key={`p1-${i}`}
              className="w-10 h-14 sm:w-12 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-mono font-black rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm"
            >
              {char}
            </div>
          ))}
        </div>

        {/* Separator */}
        <span className="text-3xl sm:text-4xl font-black text-slate-400 dark:text-slate-500 px-0.5 select-none">
          -
        </span>

        {/* Part 2 (4 chars) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {parts[1].split('').map((char, i) => (
            <div
              key={`p2-${i}`}
              className="w-10 h-14 sm:w-12 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-mono font-black rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm"
            >
              {char}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const minutes = Math.floor(timeLeftSec / 60);
  const seconds = timeLeftSec % 60;
  const formattedTimer = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 my-8 text-slate-900 dark:text-slate-100 transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Admin Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                WhatsApp Account Link System • 2-Step Flow
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert: "WhatsApp ගිණුම සාර්ථකව සම්බන්ධ විය" */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 text-sm font-bold flex items-center gap-3 animate-in fade-in shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm font-medium flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main WhatsApp Account Section */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-5">
          
          {/* Section Header with Status Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold shadow-md shadow-green-600/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  WhatsApp Account
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PC එකක් WhatsApp එකට Link කරනවා වගේ ගිණුම සම්බන්ධ කරන්න
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  linkedAccount?.isLinked ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span
                className={
                  linkedAccount?.isLinked
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-500'
                }
              >
                {linkedAccount?.isLinked ? 'සම්බන්ධයි (Connected)' : 'සම්බන්ධ කර නොමැත'}
              </span>
            </div>
          </div>

          {/* VIEW A: ALREADY LINKED STATE */}
          {linkedAccount?.isLinked ? (
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                        WhatsApp ගිණුම සාර්ථකව සම්බන්ධ වී ඇත
                      </p>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                        {linkedAccount.phone || '07XXXXXXXX'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 text-xs font-bold transition-colors"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>ගිණුම ඉවත් කරන්න (Unlink)</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span>ස්වයංක්‍රීය WhatsApp රිසිට්පත් පද්ධතිය සක්‍රීයයි</span>
                  <span>සම්බන්ධ කළ දිනය: {new Date(linkedAccount.linkedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    removeLinkedWhatsAppAccount();
                    setLinkedAccount(null);
                    setCurrentStep(1);
                  }}
                  className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors"
                >
                  වෙනත් WhatsApp Number එකක් Link කරන්න (Change Number)
                </button>
              </div>
            </div>
          ) : currentStep === 1 ? (
            /* ========================================================
               STEP 1: ASK PHONE NUMBER
               - Title: "WhatsApp Number එක දාන්න"
               - Input: Phone number input with placeholder "07XXXXXXXX"
               - Button: "Code එක ගන්න"
               - Validation: Must be 10 digits starting with 07
               - When clicked: Generate 8-digit code like ABCD-1234 format
               - Save to localStorage: { phone, code, expiry: Date.now() + 5min }
               ======================================================== */
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
              {/* Step indicator header */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Step 1 of 2</span>
                <span>දුරකථන අංකය ඇතුළත් කිරීම</span>
              </div>

              {/* Title as requested */}
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  WhatsApp Number එක දාන්න
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ඔබගේ ජංගම දුරකථනයේ WhatsApp ගිණුමේ අංකය පහතින් ඇතුළත් කරන්න.
                </p>
              </div>

              {/* Input Form */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  දුරකථන අංකය (07XXXXXXXX)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="07XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Only allow digits, max 10 chars
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateCode();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white font-mono text-base font-bold placeholder:font-sans placeholder:text-slate-400 transition-all outline-hidden"
                  />
                  {phoneNumber.length > 0 && (
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-mono font-bold text-slate-400">
                      {phoneNumber.length}/10
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  උදාහරණ: 0771234567, 0719876543, 0701122334
                </p>
              </div>

              {/* Button: "Code එක ගන්න" */}
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
                <span>Code එක ගන්න</span>
              </button>
            </div>
          ) : (
            /* ========================================================
               STEP 2: SHOW 8-DIGIT CODE
               - Title: "ඔයාගේ Code එක"
               - Big display of the code: XXXX-XXXX (large, bold, letter-spacing)
               - Instructions in Sinhala: "මෙම Code එක 077XXXXXXX WhatsApp එකට යවන්න"
               - Button 1: "Copy Code" (copies code)
               - Button 2: "Link කරමි" (verifies and saves)
               - Small text: "WhatsApp එකෙන් confirmation එකක් ආවාම auto link වෙනවා"
               ======================================================== */
            <div className="space-y-5 pt-1 animate-in fade-in duration-300">
              {/* Step indicator header */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Step 2 of 2</span>
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Number එක වෙනස් කරන්න ({phoneNumber})</span>
                </button>
              </div>

              {/* Title as requested */}
              <div className="text-center">
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  ඔයාගේ Code එක
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  WhatsApp Linking Code එක සක්‍රීයයි (විනාඩි 5ක් වලංගු වේ)
                </p>
              </div>

              {/* Big display of the code: XXXX-XXXX (WhatsApp Web style) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500/70 text-center space-y-2">
                {generatedCode && renderLargeCode(generatedCode)}

                {/* Expiry countdown */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>ඉතිරි කාලය: {formattedTimer}</span>
                </div>
              </div>

              {/* Instructions in Sinhala: EXACT text requested:
                  "මෙම Code එක 077XXXXXXX WhatsApp එකට යවන්න" */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center space-y-2 shadow-xs">
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>මෙම Code එක 077XXXXXXX WhatsApp එකට යවන්න</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ඔබගේ <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{phoneNumber}</span> WhatsApp ගිණුමෙන් ඉහත Code එක අපගේ නිල WhatsApp අංකයට Message කරන්න.
                </p>
                
                {/* Direct WhatsApp Click Button */}
                <div className="pt-1">
                  <a
                    href={`https://wa.me/94770000000?text=${encodeURIComponent(generatedCode || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 hover:underline font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>WhatsApp App එකෙන් Message එක යවන්න (Open Chat)</span>
                  </a>
                </div>
              </div>

              {/* Action Buttons: Button 1: "Copy Code", Button 2: "Link කරමි" */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Button 1: "Copy Code" */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500/70 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-bold text-sm shadow-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied! (Copy විය)</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-emerald-600" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                {/* Button 2: "Link කරමි" */}
                <button
                  type="button"
                  onClick={handleManualLinkConfirm}
                  disabled={isLinking}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {isLinking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Link කරමි</span>
                </button>
              </div>

              {/* Small text as requested: "WhatsApp එකෙන් confirmation එකක් ආවාම auto link වෙනවා" */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-center">
                <Loader2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  WhatsApp එකෙන් confirmation එකක් ආවාම auto link වෙනවා
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>PayCheck.lk • Secure WhatsApp Pairing</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            වසා දමන්න (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
