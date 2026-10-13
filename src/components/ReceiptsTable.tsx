import React, { useState, useMemo } from 'react';
import {
  ReceiptRecord,
  Language,
  SupportedBankId,
  ReceiptStatus,
} from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { SUPPORTED_BANKS } from '../constants/banks';
import { exportReceiptsToCSV } from '../services/storage';
import { shareOnWhatsApp } from '../services/whatsapp';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  FileX2,
  UserX,
  Bot,
  Send,
} from 'lucide-react';
import {
  getExcludedContacts,
  saveExcludedContacts,
  isContactExcluded,
  ExcludedContact,
} from '../services/whatsappAi';

interface ReceiptsTableProps {
  receipts: ReceiptRecord[];
  lang: Language;
  onEditReceipt: (receipt: ReceiptRecord) => void;
  onDeleteReceipt: (id: string) => void;
  onClearAll: () => void;
  onOpenSheetsModal: () => void;
  onViewImage: (receipt: ReceiptRecord) => void;
  onOpenWhatsAppAiForReceipt: (receipt: ReceiptRecord) => void;
}

export const ReceiptsTable: React.FC<ReceiptsTableProps> = ({
  receipts,
  lang,
  onEditReceipt,
  onDeleteReceipt,
  onClearAll,
  onOpenSheetsModal,
  onViewImage,
  onOpenWhatsAppAiForReceipt,
}) => {
  const t = TRANSLATIONS[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [excludedList, setExcludedList] = useState<ExcludedContact[]>(getExcludedContacts);

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Bank filter
      if (bankFilter !== 'all' && r.bankId !== bankFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = r.refNumber.toLowerCase().includes(q);
        const matchesBank = r.bankName.toLowerCase().includes(q);
        const matchesBeneficiary = (r.beneficiaryName || '').toLowerCase().includes(q);
        const matchesSender = (r.senderName || '').toLowerCase().includes(q);
        const matchesAmount = r.amount.toString().includes(q) || r.amountFormatted.includes(q);
        const matchesNotes = (r.notes || '').toLowerCase().includes(q);

        return matchesRef || matchesBank || matchesBeneficiary || matchesSender || matchesAmount || matchesNotes;
      }
      return true;
    });
  }, [receipts, bankFilter, statusFilter, searchQuery]);

  const handleToggleExclude = (record: ReceiptRecord) => {
    const phone = record.customerPhone || '';
    const name = record.senderName || '';
    const isExcluded = isContactExcluded(phone, name);

    if (isExcluded) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const updated = excludedList.filter((item) => {
        const itemClean = item.phone.replace(/[^0-9]/g, '');
        const phoneMatches = itemClean && cleanPhone && cleanPhone.includes(itemClean);
        const nameMatches = name && item.name.toLowerCase().trim() === name.toLowerCase().trim();
        return !(phoneMatches || nameMatches);
      });
      setExcludedList(updated);
      saveExcludedContacts(updated);
    } else {
      const newEx: ExcludedContact = {
        id: `ex-${Date.now()}`,
        name: name || `Customer (${record.refNumber})`,
        phone: phone || record.senderAccount || '07XXXXXXXX',
        reason: `Manual exclude from receipt ${record.refNumber}`,
        addedAt: new Date().toISOString(),
      };
      const updated = [newEx, ...excludedList];
      setExcludedList(updated);
      saveExcludedContacts(updated);
    }
  };

  const handleCopyRef = (id: string, ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredReceipts.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExportSelectedCSV = () => {
    const toExport =
      selectedIds.size > 0
        ? receipts.filter((r) => selectedIds.has(r.id))
        : filteredReceipts;
    exportReceiptsToCSV(toExport);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} selected receipt(s)?`)) {
      selectedIds.forEach((id) => onDeleteReceipt(id));
      setSelectedIds(new Set());
    }
  };

  const getStatusBadge = (status: ReceiptStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'flagged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3 h-3" />
            Flagged
          </span>
        );
      case 'duplicate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <AlertCircle className="w-3 h-3" />
            Duplicate
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden mb-12">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t.verifiedTableTitle}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredReceipts.length}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportSelectedCSV}
              disabled={filteredReceipts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>{t.exportCsv}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSheetsModal}
              disabled={filteredReceipts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t.exportSheets}</span>
            </button>

            {receipts.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Clear all stored receipts"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.clearAll}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">{t.filterByBank}</option>
              {Object.values(SUPPORTED_BANKS).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">{t.filterByStatus}</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </div>
        </div>

        {/* Selected rows batch bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
            <span>{selectedIds.size} receipt(s) selected</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportSelectedCSV}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 font-semibold shadow-2xs hover:bg-slate-50"
              >
                Export Selected
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Data Container */}
      <div className="overflow-x-auto">
        {filteredReceipts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileX2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {receipts.length === 0
                ? t.noReceiptsYet
                : 'No receipts match your current filter and search query.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filteredReceipts.length &&
                      filteredReceipts.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="py-3 px-4">Bank</th>
                <th className="py-3 px-4">Amount (LKR)</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Ref / Txn No</th>
                <th className="py-3 px-4">Parties</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReceipts.map((record) => {
                const bankConfig = SUPPORTED_BANKS[record.bankId] || SUPPORTED_BANKS.other;
                const isSelected = selectedIds.has(record.id);

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(record.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>

                    {/* Bank */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-black border ${bankConfig.badgeBg} ${bankConfig.badgeText}`}
                        >
                          {bankConfig.code}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[140px]">
                          {lang === 'si' ? bankConfig.nameSi : bankConfig.nameEn}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">
                        <span className="text-slate-400 text-xs mr-1">Rs.</span>
                        {record.amountFormatted}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
                        {record.date}
                      </div>
                      {record.time && (
                        <div className="text-[11px] text-slate-400 whitespace-nowrap">
                          {record.time}
                        </div>
                      )}
                    </td>

                    {/* Ref Number */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        <span>{record.refNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyRef(record.id, record.refNumber)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors p-0.5"
                          title="Copy Ref"
                        >
                          {copiedId === record.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {record.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 max-w-[180px]">
                          {record.notes}
                        </p>
                      )}
                    </td>

                    {/* Parties */}
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {record.beneficiaryName || record.beneficiaryAccount ? (
                        <div className="line-clamp-1 font-medium">
                          To: {record.beneficiaryName || record.beneficiaryAccount}
                        </div>
                      ) : null}
                      {record.senderName || record.senderAccount ? (
                        <div className="line-clamp-1 text-[11px] text-slate-500">
                          From: {record.senderName || record.senderAccount}
                        </div>
                      ) : null}
                      {record.customerPhone && (
                        <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          📱 {record.customerPhone}
                        </div>
                      )}
                      {isContactExcluded(record.customerPhone || '', record.senderName) && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          🚫 {lang === 'si' ? 'Excluded (Reply නැත)' : 'Auto-Reply Excluded'}
                        </span>
                      )}
                      {!record.beneficiaryName && !record.senderName && !record.customerPhone && (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center font-bold font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {record.confidence}%
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {record.imagePreviewUrl && (
                          <button
                            type="button"
                            onClick={() => onViewImage(record)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                            title={t.viewOriginal}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {/* 1-Click Send Verification to WhatsApp */}
                        <button
                          type="button"
                          onClick={() => shareOnWhatsApp(record)}
                          className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/40 rounded transition-colors"
                          title={lang === 'si' ? 'WhatsApp මගින් විස්තර යවන්න' : 'Send receipt details on WhatsApp'}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        {/* WhatsApp AI Auto-Reply & Customizer */}
                        <button
                          type="button"
                          onClick={() => onOpenWhatsAppAiForReceipt(record)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                          title="WhatsApp AI Assistant & Auto-Reply"
                        >
                          <Bot className="w-4 h-4 text-emerald-600" />
                        </button>
                        {/* 1-Click Exclude / Unexclude Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleExclude(record)}
                          className={`p-1.5 rounded transition-colors ${
                            isContactExcluded(record.customerPhone || '', record.senderName)
                              ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                          }`}
                          title={
                            isContactExcluded(record.customerPhone || '', record.senderName)
                              ? (lang === 'si' ? 'Exclude ලැයිස්තුවෙන් ඉවත් කරන්න (Reply යවන්න)' : 'Remove from Exclude List')
                              : (lang === 'si' ? 'Exclude කරන්න (මෙම Customer ට Auto-Reply නොයන ලෙස අයින් කරන්න)' : 'Exclude this customer from Auto-Reply')
                          }
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditReceipt(record)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                          title={t.edit}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteReceipt(record.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                          title={t.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
