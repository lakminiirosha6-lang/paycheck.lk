import { ReceiptRecord } from '../types';

const STORAGE_KEY = 'paycheck_lk_receipts_v1';
const LANG_STORAGE_KEY = 'paycheck_lk_language';

export const getStoredLanguage = (): 'en' | 'si' => {
  try {
    const val = localStorage.getItem(LANG_STORAGE_KEY);
    if (val === 'si' || val === 'en') return val;
  } catch (e) {
    console.error(e);
  }
  return 'en';
};

export const setStoredLanguage = (lang: 'en' | 'si') => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) {
    console.error(e);
  }
};

export const getStoredReceipts = (): ReceiptRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load receipts from localStorage:', e);
  }

  // Initial seed with two sample verified records so the user sees immediate value
  const initialSeeds: ReceiptRecord[] = [
    {
      id: 'seed-1',
      bankId: 'commercial',
      bankName: 'Commercial Bank of Ceylon',
      amount: 48500.0,
      amountFormatted: '48,500.00',
      currency: 'LKR',
      date: '2026-10-12',
      time: '14:32:15',
      refNumber: 'CB982341209',
      senderAccount: '8004129841',
      senderName: 'Mr. K. Perera',
      beneficiaryAccount: '1009845231',
      beneficiaryName: 'TechSolutions Lanka (Pvt) Ltd',
      status: 'verified',
      notes: 'Software development retainer payment',
      rawOcrText: 'COMMERCIAL BANK ONLINE TRANSACTION ADVICE... Ref: CB982341209 LKR 48,500.00',
      confidence: 96,
      fileName: 'combank_transfer_slip.png',
      fileSize: 142050,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'seed-2',
      bankId: 'boc',
      bankName: 'Bank of Ceylon (BOC)',
      amount: 14250.0,
      amountFormatted: '14,250.00',
      currency: 'LKR',
      date: '2026-10-11',
      time: '10:15 AM',
      refNumber: 'BOC77218943',
      senderAccount: '0008451293',
      senderName: 'Mrs. M. Fernando',
      beneficiaryAccount: '0076239102',
      beneficiaryName: 'Colombo Water Board',
      status: 'verified',
      notes: 'Monthly utility settlement',
      rawOcrText: 'BANK OF CEYLON BOC SmartPay E-Receipt... Ref: BOC77218943 Rs. 14,250.00',
      confidence: 94,
      fileName: 'boc_smartpay_receipt.jpg',
      fileSize: 98120,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeeds));
  } catch (e) {
    console.error(e);
  }

  return initialSeeds;
};

export const saveReceiptsToStorage = (receipts: ReceiptRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  } catch (e) {
    console.error('Failed to save receipts to localStorage:', e);
  }
};

export const checkIsDuplicateRef = (
  refNumber: string,
  receipts: ReceiptRecord[],
  excludeId?: string
): boolean => {
  if (!refNumber || refNumber.trim().length === 0) return false;
  const cleanRef = refNumber.trim().toLowerCase();
  return receipts.some(
    (r) => r.id !== excludeId && r.refNumber.trim().toLowerCase() === cleanRef
  );
};

export const exportReceiptsToCSV = (receipts: ReceiptRecord[], filename?: string): void => {
  const headers = [
    'Ref / Txn No',
    'Bank Name',
    'Amount (LKR)',
    'Date',
    'Time',
    'Sender Name',
    'Sender Account',
    'Beneficiary Name',
    'Beneficiary Account',
    'Verification Status',
    'OCR Confidence (%)',
    'Remarks / Notes',
    'File Name',
    'Record Created At',
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = receipts.map((r) => [
    escapeCSV(r.refNumber),
    escapeCSV(r.bankName),
    escapeCSV(r.amount.toFixed(2)),
    escapeCSV(r.date),
    escapeCSV(r.time || ''),
    escapeCSV(r.senderName || ''),
    escapeCSV(r.senderAccount || ''),
    escapeCSV(r.beneficiaryName || ''),
    escapeCSV(r.beneficiaryAccount || ''),
    escapeCSV(r.status.toUpperCase()),
    escapeCSV(r.confidence),
    escapeCSV(r.notes || ''),
    escapeCSV(r.fileName),
    escapeCSV(new Date(r.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel compatibility
    [headers.map(escapeCSV).join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', filename || `PayCheck_LK_Receipts_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const WHATSAPP_RECEIPTS_KEY = 'whatsapp_receipts';

export const getStoredWhatsAppReceipts = (): any[] => {
  try {
    const data = localStorage.getItem(WHATSAPP_RECEIPTS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load whatsapp_receipts:', e);
  }
  const sampleWa = [
    {
      id: 'wa-sample-1',
      amount: 2500,
      amountFormatted: '2,500.00',
      currency: 'LKR',
      date: new Date().toISOString().split('T')[0],
      refNumber: 'WA20261013778',
      senderName: 'Kasun Bandara',
      customerPhone: '0778459896',
      bankName: 'eZ Cash Mobile',
      bankId: 'ez_cash',
      source: 'whatsapp_webhook',
      createdAt: new Date().toISOString(),
      rawOcrText: 'Dialog eZ Cash Transfer Successful Rs. 2,500.00 Ref: WA20261013778 From: Kasun Bandara',
    },
  ];
  try {
    localStorage.setItem(WHATSAPP_RECEIPTS_KEY, JSON.stringify(sampleWa));
  } catch {}
  return sampleWa;
};

export const saveWhatsAppReceiptsToStorage = (receipts: any[]) => {
  try {
    localStorage.setItem(WHATSAPP_RECEIPTS_KEY, JSON.stringify(receipts));
  } catch (e) {
    console.error('Failed to save whatsapp_receipts:', e);
  }
};

const LINKED_WHATSAPP_KEY = 'linkedWhatsAppNumber';
const LINKED_WHATSAPP_ACCOUNT_KEY = 'paycheck_lk_linked_whatsapp_account';

export interface LinkedWhatsAppAccount {
  isLinked: boolean;
  phone?: string;
  code?: string;
  linkedAt: string;
  deviceName?: string;
}

export interface WhatsAppLinkingSession {
  phone: string;
  code: string;
  expiry: number;
}

const LINKING_SESSION_KEY = 'whatsapp_linking_session';

export const generate8DigitLinkingCode = (): string => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const alphanumeric = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  // Format: ABCD-1234 (e.g. LKPC-7X9A)
  const part1Prefix = 'LK';
  const part1Rest = Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const part1 = `${part1Prefix}${part1Rest}`;
  const part2 = Array.from({ length: 4 }, () => alphanumeric[Math.floor(Math.random() * alphanumeric.length)]).join('');
  return `${part1}-${part2}`;
};

export const saveLinkingSession = (session: WhatsAppLinkingSession): void => {
  try {
    localStorage.setItem(LINKING_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save whatsapp_linking_session:', e);
  }
};

export const getLinkingSession = (): WhatsAppLinkingSession | null => {
  try {
    const raw = localStorage.getItem(LINKING_SESSION_KEY);
    if (!raw) return null;
    const parsed: WhatsAppLinkingSession = JSON.parse(raw);
    if (parsed && parsed.expiry && Date.now() > parsed.expiry) {
      localStorage.removeItem(LINKING_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to get linking session:', e);
    return null;
  }
};

export const clearLinkingSession = (): void => {
  try {
    localStorage.removeItem(LINKING_SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear linking session:', e);
  }
};

export const getLinkedWhatsAppAccount = (): LinkedWhatsAppAccount | null => {
  try {
    const raw = localStorage.getItem(LINKED_WHATSAPP_ACCOUNT_KEY);
    if (raw) return JSON.parse(raw);
    const legacyNumber = localStorage.getItem(LINKED_WHATSAPP_KEY);
    if (legacyNumber) {
      return {
        isLinked: true,
        phone: legacyNumber,
        linkedAt: new Date().toISOString(),
        deviceName: `WhatsApp (${legacyNumber})`,
      };
    }
  } catch (e) {
    console.error('Failed to get linked WhatsApp account:', e);
  }
  return null;
};

export const setLinkedWhatsAppAccount = (data: { phone?: string; code?: string; deviceName?: string }): void => {
  try {
    const payload: LinkedWhatsAppAccount = {
      isLinked: true,
      phone: data.phone,
      code: data.code,
      linkedAt: new Date().toISOString(),
      deviceName: data.deviceName || (data.phone ? `WhatsApp (${data.phone})` : 'WhatsApp Account'),
    };
    localStorage.setItem(LINKED_WHATSAPP_ACCOUNT_KEY, JSON.stringify(payload));
    if (data.phone) {
      localStorage.setItem(LINKED_WHATSAPP_KEY, data.phone);
      localStorage.setItem('paycheck_lk_linked_whatsapp_number', data.phone);
    } else {
      localStorage.setItem(LINKED_WHATSAPP_KEY, 'WhatsApp Active');
    }
    clearLinkingSession();
  } catch (e) {
    console.error('Failed to save linked WhatsApp account:', e);
  }
};

export const removeLinkedWhatsAppAccount = (): void => {
  try {
    localStorage.removeItem(LINKED_WHATSAPP_ACCOUNT_KEY);
    localStorage.removeItem(LINKED_WHATSAPP_KEY);
    localStorage.removeItem('paycheck_lk_linked_whatsapp_number');
    clearLinkingSession();
  } catch (e) {
    console.error('Failed to remove linked WhatsApp account:', e);
  }
};

export const getLinkedWhatsAppNumber = (): string | null => {
  try {
    const acc = getLinkedWhatsAppAccount();
    if (acc && acc.phone) return acc.phone;
    if (acc && acc.isLinked) return 'WhatsApp Active';
    return localStorage.getItem(LINKED_WHATSAPP_KEY) || localStorage.getItem('paycheck_lk_linked_whatsapp_number');
  } catch (e) {
    console.error('Failed to get linkedWhatsAppNumber:', e);
    return null;
  }
};

export const setLinkedWhatsAppNumber = (phoneNumber: string): void => {
  try {
    setLinkedWhatsAppAccount({ phone: phoneNumber });
  } catch (e) {
    console.error('Failed to save linkedWhatsAppNumber:', e);
  }
};

export const removeLinkedWhatsAppNumber = (): void => {
  removeLinkedWhatsAppAccount();
};



