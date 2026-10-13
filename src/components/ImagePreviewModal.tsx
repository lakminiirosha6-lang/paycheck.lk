import React from 'react';
import { ReceiptRecord } from '../types';
import { X, Download, ExternalLink } from 'lucide-react';

interface ImagePreviewModalProps {
  receipt: ReceiptRecord | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ receipt, onClose }) => {
  if (!receipt || !receipt.imagePreviewUrl) return null;

  const handleDownload = () => {
    if (!receipt.imagePreviewUrl) return;
    const a = document.createElement('a');
    a.href = receipt.imagePreviewUrl;
    a.download = receipt.fileName || `Receipt_${receipt.refNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {receipt.bankName} - Slip Preview
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Ref: {receipt.refNumber} • {receipt.fileName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors"
              title="Download image"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950 min-h-[350px]">
          <img
            src={receipt.imagePreviewUrl}
            alt="Original Receipt"
            className="max-h-[75vh] w-auto object-contain rounded shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};
