import React, { useState, useEffect } from 'react';
import {
  ExtractedFields,
  Language,
  ReceiptRecord,
  ReceiptStatus,
  SupportedBankId,
} from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { SUPPORTED_BANKS } from '../constants/banks';
import { checkIsDuplicateRef } from '../services/storage';
import { shareOnWhatsApp } from '../services/whatsapp';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  ChevronDown,
  Eye,
  Copy,
  Check,
  Building,
  Calendar,
  Clock,
  Hash,
  User,
  CreditCard,
  FileText,
} from 'lucide-react';

interface ReceiptEditorProps {
  lang: Language;
  extracted: ExtractedFields;
  previewUrl?: string;
  fileName: string;
  fileSize: number;
  existingReceipts: ReceiptRecord[];
  onSave: (record: ReceiptRecord) => void;
  onCancel: () => void;
}

export const ReceiptEditor: React.FC<ReceiptEditorProps> = ({
  lang,
  extracted,
  previewUrl,
  fileName,
  fileSize,
  existingReceipts,
  onSave,
  onCancel,
}) => {
  const t = TRANSLATIONS[lang];

  // Editable fields state
  const [bankId, setBankId] = useState<SupportedBankId>(extracted.bankId);
  const [amount, setAmount] = useState<string>(
    extracted.amount !== null ? extracted.amount.toString() : ''
  );
  const [date, setDate] = useState<string>(extracted.date || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(extracted.time || '');
  const [refNumber, setRefNumber] = useState<string>(extracted.refNumber || '');
  const [senderAccount, setSenderAccount] = useState<string>(extracted.senderAccount || '');
  const [senderName, setSenderName] = useState<string>(extracted.senderName || '');
  const [customerPhone, setCustomerPhone] = useState<string>(extracted.customerPhone || '');
  const [beneficiaryAccount, setBeneficiaryAccount] = useState<string>(
    extracted.beneficiaryAccount || ''
  );
  const [beneficiaryName, setBeneficiaryName] = useState<string>(
    extracted.beneficiaryName || ''
  );
  const [status, setStatus] = useState<ReceiptStatus>('verified');
  const [notes, setNotes] = useState<string>('');
  const [showRawText, setShowRawText] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Check duplicate
  const isDuplicate = checkIsDuplicateRef(refNumber, existingReceipts);

  useEffect(() => {
    if (isDuplicate) {
      setStatus('duplicate');
    }
  }, [isDuplicate]);

  const handleCopyRef = () => {
    if (refNumber) {
      navigator.clipboard.writeText(refNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const buildRecord = (): ReceiptRecord => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    const bankConfig = SUPPORTED_BANKS[bankId];

    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bankId,
      bankName: bankConfig ? bankConfig.nameEn : 'Other Bank',
      amount: numAmount,
      amountFormatted: numAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      currency: 'LKR',
      date,
      time: time || undefined,
      refNumber: refNumber.trim(),
      senderAccount: senderAccount.trim() || undefined,
      senderName: senderName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      beneficiaryAccount: beneficiaryAccount.trim() || undefined,
      beneficiaryName: beneficiaryName.trim() || undefined,
      status: isDuplicate && status === 'verified' ? 'duplicate' : status,
      notes: notes.trim() || undefined,
      rawOcrText: extracted.rawText,
      confidence: extracted.confidence,
      imagePreviewUrl: previewUrl,
      fileName,
      fileSize,
      createdAt: new Date().toISOString(),
    };
  };

  const handleSave = () => {
    const record = buildRecord();
    onSave(record);
  };

  const handleSaveAndShareWhatsApp = () => {
    const record = buildRecord();
    shareOnWhatsApp(record);
    onSave(record);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden my-6">
      {/* Modal Header */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t.receiptEditorTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {fileName} • {Math.round(fileSize / 1024)} KB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Confidence Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span>{t.confidenceScore}:</span>
            <span className="font-bold">{extracted.confidence}%</span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Duplicate Warning */}
      {isDuplicate && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>{t.duplicateWarning}</span>
        </div>
      )}

      {/* Main Grid: Document Preview & Form Fields */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Receipt Document Preview */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center min-h-[300px] max-h-[480px] p-2 relative group">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Receipt Slip"
                className="max-h-[460px] w-auto object-contain rounded shadow-xs"
              />
            ) : (
              <div className="text-center p-6 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Sample Receipt Mode (Text OCR)</p>
              </div>
            )}
          </div>

          {/* Raw Text Accordion */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
            >
              <span>{showRawText ? t.hideRawText : t.showRawText}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showRawText ? 'rotate-180' : ''}`}
              />
            </button>
            {showRawText && (
              <div className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
                {extracted.rawText || 'No text detected'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Extracted & Editable Fields */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bank Field */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-600" />
                {t.fieldBank}
              </label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value as SupportedBankId)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
              >
                {Object.values(SUPPORTED_BANKS).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameEn} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                {t.fieldAmount}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                  Rs.
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-3 py-2 text-sm font-bold text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Reference Number Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-600" />
                  {t.fieldRef}
                </span>
                {refNumber && (
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-normal flex items-center gap-1"
                  >
                    {copiedRef ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRef ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </label>
              <input
                type="text"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                placeholder="e.g. CB982341209"
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
              />
            </div>

            {/* Date Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {t.fieldDate}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Time Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {t.fieldTime}
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 14:32:15"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Sender / Payer Account & Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {t.fieldSender}
              </label>
              <input
                type="text"
                value={senderName ? `${senderName} ${senderAccount ? `(${senderAccount})` : ''}` : senderAccount}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Account number or sender name"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Customer WhatsApp Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="text-green-600 font-bold">WhatsApp No:</span>
                  <span>{lang === 'si' ? 'දුරකථන අංකය' : 'Phone'}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">e.g. 0771234567</span>
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="07X XXXXXXX"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-green-500 outline-hidden"
              />
            </div>

            {/* Beneficiary / Payee Account & Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {t.fieldBeneficiary}
              </label>
              <input
                type="text"
                value={beneficiaryName ? `${beneficiaryName} ${beneficiaryAccount ? `(${beneficiaryAccount})` : ''}` : beneficiaryAccount}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="Beneficiary name or account"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            {/* Verification Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.fieldStatus}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReceiptStatus)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-semibold"
              >
                <option value="verified">Verified (තහවුරු කළා)</option>
                <option value="pending">Pending (පොරොත්තු)</option>
                <option value="flagged">Flagged (අවධානය අවශ්‍ය)</option>
                <option value="duplicate">Duplicate (ද්විත්ව)</option>
              </select>
            </div>

            {/* Remarks / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.fieldNotes}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional purpose, invoice #, customer name"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSaveAndShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 transition-all hover:scale-[1.01]"
              title="Save record and share verification text to WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c.969.529 1.942.809 2.805.809 3.182 0 5.768-2.586 5.768-5.766 0-3.18-2.586-5.766-5.767-5.766zm3.385 8.168c-.145.409-.844.757-1.157.781-.314.024-.627.086-2.049-.496-1.704-.696-2.793-2.457-2.879-2.571-.086-.115-.694-.925-.694-1.765s.44-1.25.597-1.42c.157-.17.343-.213.457-.213.114 0 .229.002.329.006.105.005.245-.04.383.292.144.343.491 1.203.535 1.289.043.086.072.186.014.3-.057.115-.086.186-.171.286-.086.1-.182.224-.26.301-.086.086-.176.18-.076.352.1.171.444.733.953 1.186.655.584 1.207.765 1.378.851.171.086.271.072.371-.043.1-.115.428-.499.542-.67.114-.171.229-.143.385-.086.157.057.994.469 1.165.555.171.086.286.128.329.2.043.071.043.414-.102.823z" />
              </svg>
              <span>Share on WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.saveToTable}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
