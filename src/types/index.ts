export type SupportedBankId =
  | 'commercial'
  | 'boc'
  | 'sampath'
  | 'nsb'
  | 'peoples'
  | 'hnb'
  | 'other';

export interface BankConfig {
  id: SupportedBankId;
  nameEn: string;
  nameSi: string;
  code: string;
  primaryColor: string;
  badgeBg: string;
  badgeText: string;
  keywords: string[];
  refPatterns: RegExp[];
}

export type ReceiptStatus = 'verified' | 'pending' | 'flagged' | 'duplicate';

export interface ReceiptRecord {
  id: string;
  bankId: SupportedBankId;
  bankName: string;
  amount: number;
  amountFormatted: string;
  currency: string;
  date: string;
  time?: string;
  refNumber: string;
  senderAccount?: string;
  senderName?: string;
  beneficiaryAccount?: string;
  beneficiaryName?: string;
  customerPhone?: string;
  isExcluded?: boolean;
  status: ReceiptStatus;
  notes?: string;
  rawOcrText: string;
  confidence: number;
  imagePreviewUrl?: string; // Data URL or object URL
  fileName: string;
  fileSize: number;
  createdAt: string;
  syncedToSheets?: boolean;
}

export interface ExtractedFields {
  bankId: SupportedBankId;
  bankName: string;
  amount: number | null;
  amountFormatted: string;
  currency: string;
  date: string;
  time: string;
  refNumber: string;
  senderAccount: string;
  senderName: string;
  customerPhone?: string;
  beneficiaryAccount: string;
  beneficiaryName: string;
  confidence: number;
  rawText: string;
  detectedFieldsCount: number;
}

export type Language = 'en' | 'si';
