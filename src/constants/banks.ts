import { BankConfig, SupportedBankId } from '../types';

export const SUPPORTED_BANKS: Record<SupportedBankId, BankConfig> = {
  commercial: {
    id: 'commercial',
    nameEn: 'Commercial Bank of Ceylon',
    nameSi: 'කොමර්ෂල් බැංකුව',
    code: 'COMBANK',
    primaryColor: '#024799',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-800 dark:text-blue-200 border-blue-300',
    keywords: [
      'commercial bank',
      'combank',
      'commercial bank of ceylon',
      'combank online',
      'combank digital',
      'cbc',
      'e-slip',
      'eslip',
    ],
    refPatterns: [
      /ref(?:erence)?\s*(?:no|number|#)?[:.\s]+([a-z0-9]{8,20})/i,
      /txn\s*ref[:.\s]+([a-z0-9]{8,20})/i,
      /trace\s*no[:.\s]+([0-9]{6,12})/i,
    ],
  },
  boc: {
    id: 'boc',
    nameEn: 'Bank of Ceylon (BOC)',
    nameSi: 'ලංකා බැංකුව (BOC)',
    code: 'BOC',
    primaryColor: '#b45309',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-800 dark:text-amber-200 border-amber-300',
    keywords: [
      'bank of ceylon',
      'boc',
      'boc smartpay',
      'boc online',
      'bankers to the nation',
      'smartpay',
      'boc connect',
    ],
    refPatterns: [
      /ref(?:erence)?\s*(?:no|number|#)?[:.\s]+([a-z0-9]{8,20})/i,
      /txn\s*id[:.\s]+([a-z0-9]{8,20})/i,
      /sequence\s*no[:.\s]+([0-9]{6,14})/i,
      /ft\s*[0-9]{10,16}/i,
    ],
  },
  sampath: {
    id: 'sampath',
    nameEn: 'Sampath Bank',
    nameSi: 'සම්පත් බැංකුව',
    code: 'SAMPATH',
    primaryColor: '#ea580c',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/40',
    badgeText: 'text-orange-800 dark:text-orange-200 border-orange-300',
    keywords: [
      'sampath bank',
      'sampath',
      'vishwa',
      'sampath vishwa',
      'we present your future',
      'sampath payapp',
    ],
    refPatterns: [
      /vishwa\s*ref(?:erence)?[:.\s]+([a-z0-9]{8,20})/i,
      /transaction\s*ref(?:erence)?[:.\s]+([a-z0-9]{8,20})/i,
      /ref(?:erence)?\s*(?:no|#)?[:.\s]+([a-z0-9]{8,20})/i,
    ],
  },
  nsb: {
    id: 'nsb',
    nameEn: 'National Savings Bank (NSB)',
    nameSi: 'ජාතික ඉතිරි කිරීමේ බැංකුව (NSB)',
    code: 'NSB',
    primaryColor: '#0f766e',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-800 dark:text-emerald-200 border-emerald-300',
    keywords: [
      'national savings bank',
      'nsb',
      'nsb e-banking',
      'savings giant',
      'nsb digital',
    ],
    refPatterns: [
      /journal\s*(?:no|#)?[:.\s]+([0-9]{6,14})/i,
      /receipt\s*(?:no|#)?[:.\s]+([a-z0-9]{6,16})/i,
      /ref(?:erence)?\s*(?:no|#)?[:.\s]+([a-z0-9]{6,16})/i,
    ],
  },
  peoples: {
    id: 'peoples',
    nameEn: "People's Bank",
    nameSi: 'මහජන බැංකුව',
    code: 'PEOPLES',
    primaryColor: '#b91c1c',
    badgeBg: 'bg-red-100 dark:bg-red-900/40',
    badgeText: 'text-red-800 dark:text-red-200 border-red-300',
    keywords: [
      "people's bank",
      'peoples bank',
      'peoples wave',
      'peoples digital',
      'pulse of the people',
      'peoplespay',
    ],
    refPatterns: [
      /ref(?:erence)?\s*(?:no|number|#)?[:.\s]+([a-z0-9]{8,20})/i,
      /wave\s*ref[:.\s]+([a-z0-9]{8,20})/i,
      /trans(?:action)?\s*id[:.\s]+([a-z0-9]{8,20})/i,
    ],
  },
  hnb: {
    id: 'hnb',
    nameEn: 'Hatton National Bank (HNB)',
    nameSi: 'හැටන් නැෂනල් බැංකුව (HNB)',
    code: 'HNB',
    primaryColor: '#0284c7',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/40',
    badgeText: 'text-sky-800 dark:text-sky-200 border-sky-300',
    keywords: [
      'hatton national bank',
      'hnb',
      'hnb plc',
      'hnb digital',
      'hnb momo',
      'hnb solo',
      'partner in progress',
    ],
    refPatterns: [
      /transaction\s*reference[:.\s]+([a-z0-9]{8,20})/i,
      /host\s*reference[:.\s]+([a-z0-9]{8,20})/i,
      /ref(?:erence)?\s*(?:no|#)?[:.\s]+([a-z0-9]{8,20})/i,
    ],
  },
  ez_cash: {
    id: 'ez_cash',
    nameEn: 'eZ Cash (Dialog)',
    nameSi: 'eZ Cash (ඩයලොග්)',
    code: 'EZCASH',
    primaryColor: '#dc2626',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300 border-rose-300',
    keywords: [
      'ez cash',
      'ezcash',
      'dialog ez',
      'dialog ez cash',
      'mudal yaweema',
      'labunu mudala',
      'shuddha geweema',
      'sewa gasthu',
      'sewa gasthuwa',
      'omobio',
      'dialogsc',
      'best mobile',
      'dialog axiata',
      'ez send money',
      'send money',
    ],
    refPatterns: [
      /rn[:.\s]*([0-9]{10,24})/i,
      /transaction\s*id[:.\s]+([0-9]{10,24})/i,
      /txn\s*id[:.\s]+([0-9]{10,24})/i,
      /ref(?:erence)?\s*(?:no|#)?[:.\s]+([0-9a-z]{8,24})/i,
    ],
  },
  mcash: {
    id: 'mcash',
    nameEn: 'mCash (Mobitel)',
    nameSi: 'mCash (මොබිටෙල්)',
    code: 'MCASH',
    primaryColor: '#059669',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/40',
    badgeText: 'text-teal-700 dark:text-teal-300 border-teal-300',
    keywords: [
      'mcash',
      'm-cash',
      'mobitel mcash',
      'mobitel',
      'slt mobitel',
    ],
    refPatterns: [
      /txn\s*(?:no|id)?[:.\s]+([0-9a-z]{8,24})/i,
      /ref(?:erence)?\s*(?:no|#)?[:.\s]+([0-9a-z]{8,24})/i,
      /receipt\s*no[:.\s]+([0-9a-z]{8,24})/i,
    ],
  },
  other: {
    id: 'other',
    nameEn: 'Other Bank / Slip',
    nameSi: 'වෙනත් බැංකුවක් / Wallet',
    code: 'OTHER',
    primaryColor: '#64748b',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-200 border-slate-300',
    keywords: [],
    refPatterns: [
      /ref(?:erence)?\s*(?:no|#)?[:.\s]+([a-z0-9]{6,20})/i,
      /txn\s*(?:no|id)?[:.\s]+([a-z0-9]{6,20})/i,
    ],
  },
};

export interface SampleReceipt {
  id: string;
  bankId: SupportedBankId;
  titleEn: string;
  titleSi: string;
  sampleText: string;
  fileName: string;
}

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'sample-ezcash-sms',
    bankId: 'ez_cash',
    titleEn: 'eZ Cash SMS (Dialog Mudal Yaweema)',
    titleSi: 'eZ Cash SMS (ඩයලොග් මුදල් යැවීම)',
    fileName: 'ezcash_sms_screenshot.jpg',
    sampleText: `Mudal yaweema
Geweema: 778459896
13/10/2026 19:03
Rs.1400.00 Current Balance: Rs.68.00
sewa gasthuwa: Rs.0.00
Shuddha geweema: Rs.1400.00
RN:20261013235486`,
  },
  {
    id: 'sample-ezcash-app',
    bankId: 'ez_cash',
    titleEn: 'eZ Cash App (Transaction Successful)',
    titleSi: 'eZ Cash ඇප් රිසිට්පත (සාර්ථකයි)',
    fileName: 'ezcash_app_receipt.jpg',
    sampleText: `Transaction Successful
Total Amount Rs. 1,200.00
Payment Method eZ Cash 768303937
Mobile Number 077 845 9896
Date and Time 06/10/2026 | 2:56 PM
Transaction ID 179127879010231626
You will receive a notification once the payment is completed.`,
  },
  {
    id: 'sample-ezcash-pos',
    bankId: 'ez_cash',
    titleEn: 'eZ Cash POS Thermal Slip (Shop Bill)',
    titleSi: 'eZ Cash POS මුද්‍රිත බිල (කඩේ ස්ලිප්)',
    fileName: 'ezcash_pos_print.jpg',
    sampleText: `BEST MOBILE NITTAMBUWA
Date: 2026:10:02 Time: 14:02
Dialog EZ send money
Number: 0763461254
Amount: 600
Thank You`,
  },
  {
    id: 'sample-combank',
    bankId: 'commercial',
    titleEn: 'Commercial Bank e-Slip',
    titleSi: 'කොමර්ෂල් බැංකු e-Slip',
    fileName: 'combank_transfer_slip.png',
    sampleText: `COMMERCIAL BANK OF CEYLON PLC
ONLINE BANKING TRANSACTION ADVICE
Date & Time: 2026-10-12 14:32:15
Reference No: CB982341209
Transaction Type: Fund Transfer to Third Party
From Account: 8004129841 (Mr. K. Perera)
To Account: 1009845231
Beneficiary Name: TechSolutions Lanka (Pvt) Ltd
Amount: LKR 48,500.00
Commission / Fee: LKR 30.00
Total Debited: LKR 48,530.00
Status: SUCCESSFUL
Thank you for banking with Commercial Bank`,
  },
  {
    id: 'sample-boc',
    bankId: 'boc',
    titleEn: 'BOC SmartPay Receipt',
    titleSi: 'BOC ස්මාර්ට්පේ රිසිට්පත',
    fileName: 'boc_smartpay_receipt.jpg',
    sampleText: `BANK OF CEYLON - BANKERS TO THE NATION
BOC SmartPay E-Receipt
Date: 11/10/2026
Time: 10:15 AM
Txn ID: BOC77218943
Payment Reference: FT8901239845
Payer Account: 0008451293 (Mrs. M. Fernando)
Payee Account: 0076239102
Payee Name: Colombo Water Board & Utility
Amount: Rs. 14,250.00
Transaction Charge: Rs. 0.00
Payment Status: COMPLETED
Bank of Ceylon Customer Care: 1975`,
  },
  {
    id: 'sample-sampath',
    bankId: 'sampath',
    titleEn: 'Sampath Vishwa Transfer',
    titleSi: 'සම්පත් විශ්ව මාරු කිරීම',
    fileName: 'sampath_vishwa_transfer.png',
    sampleText: `SAMPATH BANK PLC - WE PRESENT YOUR FUTURE
SAMPATH VISHWA INTERNET BANKING
Transaction Receipt
Date: 2026-10-10
Time: 18:45:20
Transaction Ref: SV-2026-904128
Transfer Type: CEFT Instant Transfer
Source Account: 0029 8812 4432 (A. Jayasinghe)
Beneficiary Bank: HNB PLC
Beneficiary Account: 0390 1029 4401
Beneficiary Name: D. L. Wickramasinghe
Transfer Amount: LKR 125,000.00
Remarks: Monthly Office Rent Payment
Transaction Status: Successful`,
  },
  {
    id: 'sample-peoples',
    bankId: 'peoples',
    titleEn: "People's Wave Payment",
    titleSi: 'මහජන බැංකු Wave ගෙවීම',
    fileName: 'peoples_wave_slip.png',
    sampleText: `PEOPLE'S BANK - PULSE OF THE PEOPLE
PEOPLE'S WAVE DIGITAL BANKING
Payment Advice / Transaction Record
Date: 09-10-2026 11:22:04
Reference: PB884102931
Sender: H. M. Bandara (A/C: 1982001928)
Beneficiary: Ceylon Electricity Board
Beneficiary Account: 8200194812
Amount: Rs. 8,760.00
Status: Transaction Successful
For inquiries call 1961`,
  },
  {
    id: 'sample-hnb',
    bankId: 'hnb',
    titleEn: 'HNB Digital Transaction',
    titleSi: 'HNB ඩිජිටල් ගනුදෙනුව',
    fileName: 'hnb_digital_slip.png',
    sampleText: `HATTON NATIONAL BANK PLC
HNB DIGITAL BANKING RECEIPT
Date & Time: 12-Oct-2026 09:14:02
Transaction Reference: HNB-9938471
Host Reference: 77281944
From: Account 0039201984
To: Account 0058291039
Beneficiary: Sunil Traders & Distributors
Transfer Amount: LKR 37,800.00
Status: CONFIRMED
HNB Customer Care: 011 290 8000`,
  },
  {
    id: 'sample-nsb',
    bankId: 'nsb',
    titleEn: 'NSB Deposit Receipt',
    titleSi: 'ජාතික ඉතිරි කිරීමේ බැංකු රිසිට්පත',
    fileName: 'nsb_deposit_slip.jpg',
    sampleText: `NATIONAL SAVINGS BANK
SAVINGS GIANT OF SRI LANKA
E-Receipt Voucher
Date: 2026/10/08
Time: 15:30:10
Receipt No: NSB-4401928
Journal No: JN998231
Account Number: 1-0024-991204
Account Name: P. G. Silva
Deposit Amount: LKR 25,000.00
Branch: Kandy Main Branch
Status: PROCESSED`,
  },
];
