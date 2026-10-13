import React, { useState, useEffect } from 'react';
import { ReceiptRecord, Language } from '../types';
import {
  ExcludedContact,
  WhatsAppContact,
  AutoReplySettings,
  getExcludedContacts,
  saveExcludedContacts,
  isContactExcluded,
  getAutoReplySettings,
  saveAutoReplySettings,
  getSavedContacts,
  saveContact,
  formatSriLankanWhatsAppNumber,
  sendWhatsAppMessage,
  generateAiWhatsAppMessage,
  generateAiAutoReply,
} from '../services/whatsappAi';
import {
  MessageSquare,
  Sparkles,
  UserX,
  Send,
  Settings,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Plus,
  Trash2,
  Copy,
  Check,
  Phone,
  Receipt,
  Bot,
  ExternalLink,
} from 'lucide-react';

interface WhatsAppAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: ReceiptRecord[];
  selectedReceipt?: ReceiptRecord | null;
  lang: Language;
}

type TabType = 'send' | 'autoreply' | 'excluded' | 'settings';

export const WhatsAppAiModal: React.FC<WhatsAppAiModalProps> = ({
  isOpen,
  onClose,
  receipts,
  selectedReceipt,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('send');

  // Tab 1: Send to Customer State
  const [currentReceiptId, setCurrentReceiptId] = useState<string>(
    selectedReceipt ? selectedReceipt.id : (receipts[0]?.id || '')
  );
  const [customerName, setCustomerName] = useState<string>(
    selectedReceipt?.beneficiaryName || selectedReceipt?.senderName || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>('0771234567');
  const [tone, setTone] = useState<string>('Friendly & Delivery Confirmation');
  const [customPrompt, setCustomPrompt] = useState<string>(
    lang === 'si'
      ? 'ගෙවීම් ලැබුණු බව තහවුරු කර, අදම පාර්සලය කුරියර් කරන බවත්, ඕනෑම ගැටලුවකට අප ඇමතිය හැකි බවත් සඳහන් කරන්න.'
      : 'Confirm payment receipt, state order is being packed for delivery today, and thank them.'
  );
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Tab 2: Auto-Reply Simulator
  const [incomingQuery, setIncomingQuery] = useState<string>(
    lang === 'si'
      ? 'මම අද උදේ රුපියල් 48,500ක් දැම්මා ComBank එකෙන්. Slip එක බැලුවද? මගේ ඕඩර් එක කවද්ද එවන්නේ?'
      : 'I transferred Rs. 48,500 via ComBank. Did you verify the slip? When will you send my order?'
  );
  const [autoReplyCustomerPhone, setAutoReplyCustomerPhone] = useState<string>('0719876543');
  const [autoReplyCustomerName, setAutoReplyCustomerName] = useState<string>('Kamal Silva');
  const [autoReplyResult, setAutoReplyResult] = useState<string>('');
  const [isAutoReplying, setIsAutoReplying] = useState(false);
  const [autoReplyError, setAutoReplyError] = useState<string | null>(null);

  // Tab 3: Exclude List State
  const [excludedList, setExcludedList] = useState<ExcludedContact[]>(getExcludedContacts);
  const [newExName, setNewExName] = useState('');
  const [newExPhone, setNewExPhone] = useState('');
  const [newExReason, setNewExReason] = useState('');

  // Tab 4: Settings State
  const [settings, setSettings] = useState<AutoReplySettings>(getAutoReplySettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Check if current target contact is excluded
  const isTargetExcluded = isContactExcluded(customerPhone, customerName);
  const isAutoReplyTargetExcluded = isContactExcluded(autoReplyCustomerPhone, autoReplyCustomerName);

  // Active receipt object
  const activeReceipt = receipts.find((r) => r.id === currentReceiptId) || receipts[0] || null;

  useEffect(() => {
    if (selectedReceipt) {
      setCurrentReceiptId(selectedReceipt.id);
      if (selectedReceipt.senderName) setCustomerName(selectedReceipt.senderName);
      if (selectedReceipt.customerPhone) setCustomerPhone(selectedReceipt.customerPhone);
    }
  }, [selectedReceipt]);

  const handleReceiptSelect = (id: string) => {
    setCurrentReceiptId(id);
    const found = receipts.find((r) => r.id === id);
    if (found) {
      if (found.senderName) setCustomerName(found.senderName);
      if (found.customerPhone) setCustomerPhone(found.customerPhone);
    }
  };

  if (!isOpen) return null;

  // Handle Tab 1 Generate Message
  const handleGenerateAiMessage = async () => {
    setIsGenerating(true);
    setMessageError(null);
    try {
      const msg = await generateAiWhatsAppMessage({
        receipt: activeReceipt,
        tone,
        userPrompt: customPrompt,
        customerName,
        language: lang,
      });
      setGeneratedMessage(msg);
    } catch (err: any) {
      setMessageError(err.message || 'AI message generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Tab 1 Send
  const handleSendToCustomer = () => {
    if (!customerPhone) {
      alert('Please enter customer phone number');
      return;
    }
    const textToSend =
      generatedMessage ||
      (activeReceipt
        ? `✅ Verified via PayCheck.lk\nBank: ${activeReceipt.bankName}\nAmount: Rs. ${activeReceipt.amountFormatted}\nRef: ${activeReceipt.refNumber}\nDate: ${activeReceipt.date}\nThank you!`
        : 'Thank you for your payment!');

    saveContact({ name: customerName || 'Customer', phone: customerPhone });
    sendWhatsAppMessage(customerPhone, textToSend);
  };

  // Handle Tab 2 Auto Reply
  const handleGenerateAutoReply = async () => {
    setIsAutoReplying(true);
    setAutoReplyError(null);
    try {
      const reply = await generateAiAutoReply({
        incomingMessage: incomingQuery,
        customerPhone: autoReplyCustomerPhone,
        customerName: autoReplyCustomerName,
        recentReceipts: receipts,
        customRules: settings.customRules,
        language: lang,
      });
      setAutoReplyResult(reply);
    } catch (err: any) {
      setAutoReplyError(err.message || 'Auto-reply generation failed');
    } finally {
      setIsAutoReplying(false);
    }
  };

  // Handle Tab 3 Add Exclude
  const handleAddExcluded = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExPhone.trim() && !newExName.trim()) return;

    const newContact: ExcludedContact = {
      id: `ex-${Date.now()}`,
      name: newExName.trim() || 'Blocked Customer',
      phone: newExPhone.trim(),
      reason: newExReason.trim() || 'Manual exclusion by merchant',
      addedAt: new Date().toISOString(),
    };

    const updated = [newContact, ...excludedList];
    setExcludedList(updated);
    saveExcludedContacts(updated);

    setNewExName('');
    setNewExPhone('');
    setNewExReason('');
  };

  const handleRemoveExcluded = (id: string) => {
    const updated = excludedList.filter((c) => c.id !== id);
    setExcludedList(updated);
    saveExcludedContacts(updated);
  };

  // Handle Tab 4 Save Settings
  const handleSaveSettings = () => {
    saveAutoReplySettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-green-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  {lang === 'si' ? 'WhatsApp AI සහකරු & Auto-Reply' : 'WhatsApp AI Assistant & Auto-Reply'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-950/40 text-green-200 border border-green-400/40">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-green-100">
                {lang === 'si'
                  ? 'Customer ලාට AI මගින් පණිවිඩ යැවීම, Auto-Reply සහ Exclude list කළමනාකරණය'
                  : 'AI-powered customer messaging, intelligent auto-replies, and selective contact exclusion'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'send'
                ? 'border-green-600 text-green-700 dark:text-green-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{lang === 'si' ? '1. Customer වෙත යැවීම' : '1. Send to Customer'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('autoreply')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'autoreply'
                ? 'border-green-600 text-green-700 dark:text-green-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'si' ? '2. AI Auto-Reply' : '2. AI Auto-Reply'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('excluded')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'excluded'
                ? 'border-green-600 text-green-700 dark:text-green-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-rose-500" />
            <span>
              {lang === 'si' ? '3. Exclude List (අයින් කළ අය)' : '3. Excluded Contacts'}
              {excludedList.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {excludedList.length}
                </span>
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-green-600 text-green-700 dark:text-green-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{lang === 'si' ? '4. නීති සහ සැකසුම්' : '4. AI Rules & Settings'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: SEND TO CUSTOMER */}
          {activeTab === 'send' && (
            <div className="space-y-5">
              {/* Exclude Warning if matched */}
              {isTargetExcluded && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <div>
                    <strong>{lang === 'si' ? 'අවවාදයයි: මෙම Customer Exclude List එකේ සිටී!' : 'Warning: This Customer is in your Exclude List!'}</strong>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                      {lang === 'si'
                        ? 'ඔබ මෙම අංකයට ස්වයංක්‍රීයව reply නොයන ලෙස සකසා ඇත. ඔබ කැමති නම් Exclude List එකෙන් මෙය ඉවත් කළ හැක.'
                        : 'Auto-reply is blocked for this phone number based on your exclusion settings.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Verified Receipt */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'si' ? 'තහවුරු කළ රිසිට්පත තෝරන්න' : 'Attached Verified Receipt'}</span>
                  </label>
                  <select
                    value={currentReceiptId}
                    onChange={(e) => handleReceiptSelect(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  >
                    {receipts.length === 0 ? (
                      <option value="">No verified receipts</option>
                    ) : (
                      receipts.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.bankName} - Rs. {r.amountFormatted} (Ref: {r.refNumber})
                        </option>
                      ))
                    )}
                  </select>
                  {activeReceipt && (
                    <div className="mt-1.5 p-2 rounded bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                      <span>Ref: {activeReceipt.refNumber}</span>
                      <span>Rs. {activeReceipt.amountFormatted} ({activeReceipt.date})</span>
                    </div>
                  )}
                </div>

                {/* Customer Phone & Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-green-600" />
                      <span>WhatsApp Number</span>
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name"
                      className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Tone & AI Prompt */}
              <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>
                      {lang === 'si' ? 'AI පණිවිඩ උපදෙස් (Gemini AI Prompt)' : 'AI Message Customizer'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Tone:</span>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="p-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      <option value="Friendly & Delivery Confirmation">Friendly & Delivery Confirmation</option>
                      <option value="Formal Bank Payment Advice">Formal Bank Payment Advice</option>
                      <option value="Polite Thank You with Courier Info">Polite Thank You with Courier</option>
                      <option value="Urgent Order Action Needed">Urgent Order Action</option>
                    </select>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="ඔබට Customer ට පැවසීමට අවශ්‍ය විශේෂ විස්තර මෙහි ලියන්න (උදා: හෙට උදේට ඩිලිවරි කරනවා, ස්තුතියි ආදී)..."
                    className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-green-500 outline-hidden"
                  />
                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[11px] font-bold text-slate-500 self-center mr-1">
                      {lang === 'si' ? 'කෙටි උපදෙස්:' : 'Quick Prompts:'}
                    </span>
                    {[
                      {
                        label: lang === 'si' ? '✅ ගෙවීම තහවුරුයි & Courier භාරදෙනවා' : '✅ Payment Verified & Dispatch',
                        prompt: lang === 'si' ? 'ගෙවීම් ලැබුණු බව තහවුරු කර, අදම පාර්සලය කුරියර් කරන බවත්, ඕනෑම ගැටලුවකට අප ඇමතිය හැකි බවත් සඳහන් කරන්න.' : 'Confirm payment receipt, state order is being packed for delivery today, and thank them.',
                      },
                      {
                        label: lang === 'si' ? '📦 Tracking අංකය පසුව එවන්නම්' : '📦 Order packed, tracking soon',
                        prompt: lang === 'si' ? 'ගෙවීම් ලැබුණා. භාණ්ඩය Pack කර ඇති අතර tracking number එක හවසට එවනු ඇත.' : 'Payment received. Item is packed and tracking number will be sent in the evening.',
                      },
                      {
                        label: lang === 'si' ? '⚠️ Slip එක අපැහැදිලියි' : '⚠️ Unclear slip, please resend',
                        prompt: lang === 'si' ? 'ඔබ එවූ රිසිට්පත අපැහැදිලියි, කරුණාකර Reference අංකය සහ මුදල පෙනෙන පරිදි පැහැදිලි ඡායාරූපයක් එවන්න.' : 'The receipt image is unclear, please send a clear photo showing reference number and amount.',
                      },
                      {
                        label: lang === 'si' ? '💰 ඉතිරි මුදල ගෙවන්න' : '💰 Balance payment remaining',
                        prompt: lang === 'si' ? 'මුදලින් කොටසක් ලැබුණි, කරුණාකර ඉතිරි මුදලද ගෙවා තහවුරු කරන්න.' : 'Partial payment received, please transfer the remaining balance to dispatch order.',
                      },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomPrompt(p.prompt)}
                        className="px-2 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleGenerateAiMessage}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {lang === 'si' ? 'Gemini AI මගින් පණිවිඩය සකසන්න' : 'Draft Message with Gemini AI'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {messageError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{messageError}</span>
                </div>
              )}

              {/* Generated Message Preview & Send */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>
                    {lang === 'si' ? 'WhatsApp පණිවිඩය (සංස්කරණය කළ හැක)' : 'WhatsApp Message Preview (Editable)'}
                  </span>
                  {generatedMessage && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedMessage);
                        setCopiedMessage(true);
                        setTimeout(() => setCopiedMessage(false), 2000);
                      }}
                      className="text-[11px] text-green-600 hover:text-green-700 flex items-center gap-1 font-semibold"
                    >
                      {copiedMessage ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedMessage ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  )}
                </label>
                <textarea
                  rows={4}
                  value={generatedMessage}
                  onChange={(e) => setGeneratedMessage(e.target.value)}
                  placeholder="Click 'Draft Message with Gemini AI' above to generate personalized text, or type custom message..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-sans focus:ring-2 focus:ring-green-500 outline-hidden leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500">
                  Target: <strong>{formatSriLankanWhatsAppNumber(customerPhone) || customerPhone}</strong>
                </span>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  {activeReceipt && (
                    <button
                      type="button"
                      onClick={() => {
                        const slipSummary = `✅ *Verified via PayCheck.lk*\n🏦 *Bank:* ${activeReceipt.bankName}\n💰 *Amount:* Rs. ${activeReceipt.amountFormatted}\n🔢 *Ref No:* ${activeReceipt.refNumber}\n📅 *Date:* ${activeReceipt.date}\n🙏 Thank you for your payment!`;
                        setGeneratedMessage(slipSummary);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-bold text-xs transition-colors"
                      title="Insert standard verified receipt summary"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'si' ? 'රිසිට්පත් විස්තර ඇතුළත් කරන්න' : 'Insert Slip Facts'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSendToCustomer}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-green-600/20 transition-all hover:scale-105"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c.969.529 1.942.809 2.805.809 3.182 0 5.768-2.586 5.768-5.766 0-3.18-2.586-5.766-5.767-5.766zm3.385 8.168c-.145.409-.844.757-1.157.781-.314.024-.627.086-2.049-.496-1.704-.696-2.793-2.457-2.879-2.571-.086-.115-.694-.925-.694-1.765s.44-1.25.597-1.42c.157-.17.343-.213.457-.213.114 0 .229.002.329.006.105.005.245-.04.383.292.144.343.491 1.203.535 1.289.043.086.072.186.014.3-.057.115-.086.186-.171.286-.086.1-.182.224-.26.301-.086.086-.176.18-.076.352.1.171.444.733.953 1.186.655.584 1.207.765 1.378.851.171.086.271.072.371-.043.1-.115.428-.499.542-.67.114-.171.229-.143.385-.086.157.057.994.469 1.165.555.171.086.286.128.329.2.043.071.043.414-.102.823z" />
                    </svg>
                    <span>
                      {lang === 'si' ? 'WhatsApp මගින් Customer ට යවන්න' : 'Send to Customer on WhatsApp'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI AUTO-REPLY ASSISTANT */}
          {activeTab === 'autoreply' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span>
                    {lang === 'si' ? 'AI Auto-Responder තාක්ෂණය' : 'Smart Gemini Auto-Reply System'}
                  </span>
                </p>
                <p className="leading-relaxed">
                  {lang === 'si'
                    ? 'Customer ගේ පණිවිඩය කියවා, ඔබගේ තහවුරු කළ රිසිට්පත් සමග ගැලපෙන මුදල හෝ Ref Number එක සොයාගෙන, ගැලපෙන ආචාරශීලී පිළිතුරක් තත්පරයකින් සකසයි.'
                    : 'Analyzes incoming customer text, matches against verified receipts memory, and prepares the accurate confirmation reply.'}
                </p>
              </div>

              {isAutoReplyTargetExcluded && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-600" />
                  <span>
                    <strong>Blocked:</strong> This contact is in your Exclude list. Automated replies will not be sent to them.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Phone
                  </label>
                  <input
                    type="text"
                    value={autoReplyCustomerPhone}
                    onChange={(e) => setAutoReplyCustomerPhone(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={autoReplyCustomerName}
                    onChange={(e) => setAutoReplyCustomerName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {lang === 'si' ? 'Customer එවූ පණිවිඩය (Incoming Message)' : 'Incoming Customer Message'}
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={incomingQuery}
                  onChange={(e) => setIncomingQuery(e.target.value)}
                  placeholder="Paste or type customer question here..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-sans focus:ring-2 focus:ring-blue-500 outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateAutoReply}
                  disabled={isAutoReplying || isAutoReplyTargetExcluded}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
                >
                  {isAutoReplying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini AI Analyzing &amp; Drafting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {lang === 'si' ? 'AI Auto-Reply එක සකසන්න' : 'Generate Smart Auto-Reply'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {autoReplyError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{autoReplyError}</span>
                </div>
              )}

              {/* Generated Auto-Reply Result */}
              {autoReplyResult && (
                <div className="p-4 rounded-xl bg-green-50/60 dark:bg-green-950/30 border border-green-200 dark:border-green-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-green-900 dark:text-green-200 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{lang === 'si' ? 'AI සකස් කළ පිළිතුර:' : 'Generated AI Auto-Reply:'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(autoReplyResult);
                        alert('Copied to clipboard!');
                      }}
                      className="text-xs text-green-700 font-semibold"
                    >
                      Copy
                    </button>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg text-xs sm:text-sm leading-relaxed whitespace-pre-wrap border border-green-100 dark:border-green-900">
                    {autoReplyResult}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => sendWhatsAppMessage(autoReplyCustomerPhone, autoReplyResult)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send This Reply via WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXCLUDE LIST (REPLY NOYAWANA AYA) */}
          {activeTab === 'excluded' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-rose-600" />
                  <span>
                    {lang === 'si' ? 'Reply යැවීමෙන් වළක්වන ලද අය (Exclude List)' : 'Excluded Contacts / Blacklist'}
                  </span>
                </p>
                <p className="leading-relaxed text-rose-800 dark:text-rose-300">
                  {lang === 'si'
                    ? 'මෙහි ඇතුළත් කරන දුරකථන අංක හෝ නම් සඳහා ස්වයංක්‍රීයව කිසිදු Auto-Reply එකක් යැවීම අවහිර කෙරේ. අවශ්‍ය ඕනෑම මොහොතක කෙනෙකු අයින් කිරීමට හෝ එකතු කිරීමට පුළුවන.'
                    : 'Contacts and phone numbers listed here will never receive automated replies. You can easily add or remove entries anytime.'}
                </p>
              </div>

              {/* Add New Excluded Contact Form */}
              <form onSubmit={handleAddExcluded} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>
                    {lang === 'si' ? 'අලුත් කෙනෙකු Exclude ලැයිස්තුවට එක් කරන්න' : 'Add New Contact to Exclude List'}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    placeholder="Customer Name / Business"
                    className="p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    value={newExPhone}
                    onChange={(e) => setNewExPhone(e.target.value)}
                    placeholder="Phone No (e.g. 0712345678)"
                    className="p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                  <input
                    type="text"
                    value={newExReason}
                    onChange={(e) => setNewExReason(e.target.value)}
                    placeholder="Reason (optional, e.g. Personal)"
                    className="p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>{lang === 'si' ? 'Exclude ලැයිස්තුවට එක් කරන්න' : 'Add to Exclude List'}</span>
                  </button>
                </div>
              </form>

              {/* List of Excluded Contacts */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'si' ? 'දැනට Exclude කර ඇති ගිණුම්:' : 'Currently Excluded Contacts:'} ({excludedList.length})
                </h4>

                {excludedList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No contacts currently excluded.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    {excludedList.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{contact.name}</span>
                            <span className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                              {contact.phone}
                            </span>
                          </div>
                          {contact.reason && (
                            <p className="text-[11px] text-slate-500 italic">{contact.reason}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExcluded(contact.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Remove from exclude list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & CUSTOM RULES */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className="space-y-4">
                {/* Enable toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {lang === 'si' ? 'AI Auto-Responder සක්‍රීය කරන්න' : 'Enable AI Auto-Responder System'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Toggle active status for automated drafting and response system
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.isEnabled}
                      onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'si' ? 'ඔබගේ ව්‍යාපාරයේ හෝ සාප්පුවේ නම' : 'Your Business Name'}
                  </label>
                  <input
                    type="text"
                    value={settings.businessName}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                    className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                {/* Custom AI Merchant Rules */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {lang === 'si' ? 'AI සඳහා මගේ ස්ථිර උපදෙස් සහ රීති (Custom Business Instructions)' : 'Custom AI Business Rules for Customer Replies'}
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={settings.customRules}
                    onChange={(e) => setSettings({ ...settings, customRules: e.target.value })}
                    placeholder="උදාහරණයක් ලෙස: 'සැමවිටම ආචාරශීලීව සිංහලෙන් ස්තුතිවන්ත වන්න. රිසිට්පත තහවුරු කළ විට අදම හෝ හෙට පාර්සලය එවනු ඇතැයි පවසන්න. රිසිට්පත වැරදි නම් පැහැදිලි ඡායාරූපයක් එවන්නැයි ඉල්ලන්න'..."
                    className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-sans focus:ring-2 focus:ring-green-500 outline-hidden leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gemini AI will strictly apply these instructions whenever analyzing customer questions.
                  </p>
                </div>

                {/* Signature */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Auto Signature Footer
                  </label>
                  <input
                    type="text"
                    value={settings.autoSignature}
                    onChange={(e) => setSettings({ ...settings, autoSignature: e.target.value })}
                    className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {settingsSaved && (
                <div className="p-2.5 rounded-lg bg-green-50 text-green-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Settings saved successfully!</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            {lang === 'si' ? 'ශ්‍රී ලංකා WhatsApp ගැළපුම: +94 ස්වයංක්‍රීයව හැඩගැසේ' : 'Sri Lanka WhatsApp formatted (+94 auto-prefixed)'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
