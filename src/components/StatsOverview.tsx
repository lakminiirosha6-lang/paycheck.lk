import React from 'react';
import { ReceiptRecord, Language } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { Receipt, Coins, CalendarDays, Landmark } from 'lucide-react';

interface StatsOverviewProps {
  receipts: ReceiptRecord[];
  lang: Language;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ receipts, lang }) => {
  const t = TRANSLATIONS[lang];

  const totalCount = receipts.length;
  const totalAmount = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = receipts.filter(
    (r) => r.createdAt.slice(0, 10) === todayStr || r.date === todayStr
  ).length;

  // Find top bank
  const bankCounts: Record<string, number> = {};
  for (const r of receipts) {
    bankCounts[r.bankName] = (bankCounts[r.bankName] || 0) + 1;
  }
  let topBankName = '-';
  let maxCount = 0;
  for (const [name, count] of Object.entries(bankCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topBankName = name.replace('Bank of Ceylon (BOC)', 'BOC').replace('Commercial Bank of Ceylon', 'Commercial Bank');
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6">
      {/* Total Receipts */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.totalReceipts}
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {totalCount}
          </span>
          <span className="text-xs text-slate-400">slips</span>
        </div>
      </div>

      {/* Total Amount */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.totalAmount}
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-xs font-bold text-slate-400">LKR</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white truncate">
            {totalAmount.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      </div>

      {/* Added Today */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.todayCount}
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {todayCount}
          </span>
          <span className="text-xs text-slate-400">today</span>
        </div>
      </div>

      {/* Top Bank */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.topBank}
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Landmark className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-lg font-bold text-slate-900 dark:text-white truncate block">
            {topBankName}
          </span>
        </div>
      </div>
    </div>
  );
};
