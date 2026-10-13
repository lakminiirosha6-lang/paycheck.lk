import { ExtractedFields, SupportedBankId } from '../types';
import { SUPPORTED_BANKS } from '../constants/banks';

/**
 * Parses raw OCR text to extract Sri Lankan bank receipt fields
 */
export const extractReceiptFields = (
  rawText: string,
  ocrConfidence: number = 85
): ExtractedFields => {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const lowerText = rawText.toLowerCase();

  // 1. Detect Bank
  let detectedBankId: SupportedBankId = 'other';
  let bankMatchScore = 0;

  for (const [bankId, config] of Object.entries(SUPPORTED_BANKS)) {
    if (bankId === 'other') continue;
    let score = 0;
    for (const kw of config.keywords) {
      if (lowerText.includes(kw)) {
        score += kw.length; // weight longer keyword matches higher
      }
    }
    if (score > bankMatchScore) {
      bankMatchScore = score;
      detectedBankId = bankId as SupportedBankId;
    }
  }

  const bankName = SUPPORTED_BANKS[detectedBankId].nameEn;

  // 2. Extract Amount
  let detectedAmount: number | null = null;
  let formattedAmount = '';

  // Priority regexes looking for Amount labels first (prioritize net payment terms in eZ Cash like Shuddha Geweema & Labunu Mudala)
  const amountWithLabelRegexes = [
    /(?:shuddha\s*geweema|shuddha\s*geweema[:\s]|labunu\s*mudala)[\s:=–-]+(?:lkr|rs\.?|slr|රු\.?)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    /(?:total\s*amount|transfer\s*amount|payment\s*amount|deposit\s*amount|debited\s*amount|මුදල)[\s:=–-]+(?:lkr|rs\.?|slr|රු\.?)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    /\bamount[\s:=–-]+(?:lkr|rs\.?|slr|රු\.?)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    /(?:lkr|rs\.?|slr|රු\.?)\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})?)/i,
    /(?:lkr|rs\.?|slr|රු\.?)\s*([0-9]{2,10}(?:\.[0-9]{2}))/i,
  ];

  for (const rx of amountWithLabelRegexes) {
    const match = rawText.match(rx);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        // Exclude trivial fee numbers if larger amount exists
        if (!detectedAmount || parsed > detectedAmount) {
          detectedAmount = parsed;
          formattedAmount = parsed.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          // If matched Shuddha Geweema or Labunu Mudala or Total Amount, lock it in
          if (/shuddha|labunu|total/i.test(rx.source)) {
            break;
          }
        }
      }
    }
  }

  // Fallback: look for lines containing numbers with decimals and commas like "48,500.00"
  if (!detectedAmount) {
    const fallbackMatches = rawText.match(/\b([0-9]{1,3}(?:,[0-9]{3})+\.[0-9]{2})\b/g);
    if (fallbackMatches && fallbackMatches.length > 0) {
      let maxAmt = 0;
      for (const m of fallbackMatches) {
        const val = parseFloat(m.replace(/,/g, ''));
        if (val > maxAmt) maxAmt = val;
      }
      if (maxAmt > 0) {
        detectedAmount = maxAmt;
        formattedAmount = maxAmt.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
    }
  }

  // 3. Extract Date
  let detectedDate = '';
  const datePatterns = [
    // Colon-separated date from POS slips (e.g., Date: 2026:10:02)
    /\b(202[0-9]:(?:0[1-9]|1[0-2]):(?:0[1-9]|[12][0-9]|3[01]))\b/,
    // YYYY-MM-DD or YYYY/MM/DD
    new RegExp('\\b(202[0-9][-/.] (?:0[1-9]|1[0-2])[-/.] (?:0[1-9]|[12][0-9]|3[01]))\\b'.replace(/ /g, '')),
    // DD-MM-YYYY or DD/MM/YYYY
    new RegExp('\\b((?:0[1-9]|[12][0-9]|3[01])[-/.](?:0[1-9]|1[0-2])[-/.]202[0-9])\\b'),
    // DD-Mon-YYYY (e.g. 12-Oct-2026)
    new RegExp('\\b((?:0?[1-9]|[12][0-9]|3[01])[-/\\s]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\\s]+202[0-9])\\b', 'i'),
  ];

  for (const dp of datePatterns) {
    const match = rawText.match(dp);
    if (match && match[1]) {
      detectedDate = normalizeDateString(match[1]);
      break;
    }
  }

  if (!detectedDate) {
    detectedDate = new Date().toISOString().slice(0, 10);
  }

  // 4. Extract Time
  let detectedTime = '';
  const timeMatch = rawText.match(
    /\b((?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?(?:\s*(?:AM|PM|am|pm))?)\b/
  );
  if (timeMatch && timeMatch[1]) {
    detectedTime = timeMatch[1].trim();
  }

  // 5. Extract Reference / Transaction Number
  let detectedRef = '';

  // Check bank-specific regex patterns first
  const bankConfig = SUPPORTED_BANKS[detectedBankId];
  if (bankConfig?.refPatterns) {
    for (const pat of bankConfig.refPatterns) {
      const match = rawText.match(pat);
      if (match && match[1]) {
        detectedRef = match[1].trim();
        break;
      }
    }
  }

  // General fallback reference patterns
  if (!detectedRef) {
    const generalRefPatterns = [
      /\bRN[:.\s]*([0-9]{10,24})\b/i,
      /(?:transaction\s*id|txn\s*id)[\s:=–-]+([0-9]{10,24})/i,
      /(?:ref(?:erence)?\s*(?:no|number|#|id)?|txn\s*(?:id|ref|no)?|trace\s*no|receipt\s*no|sequence\s*no)[\s:=–-]+([a-z0-9\-_]{6,25})/i,
      /\b(FT[0-9]{10,18})\b/i,
      /\b(SV[-_]?[0-9]{4}[-_]?[0-9]{5,10})\b/i,
      /\b(CB[0-9]{7,15})\b/i,
      /\b(BOC[0-9]{6,15})\b/i,
      /\b(HNB[-_]?[0-9]{6,15})\b/i,
      /\b(PB[0-9]{7,15})\b/i,
    ];

    for (const gp of generalRefPatterns) {
      const match = rawText.match(gp);
      if (match && match[1]) {
        detectedRef = match[1].trim();
        break;
      }
    }
  }

  // 6. Extract Sender & Beneficiary
  let senderAccount = '';
  let senderName = '';
  let beneficiaryAccount = '';
  let beneficiaryName = '';

  // Check for eZ Cash App payment method line
  const ezMethodMatch = rawText.match(/Payment\s*Method[\s:=–-]+eZ\s*Cash\s*([0-9]+)/i);
  if (ezMethodMatch && ezMethodMatch[1]) {
    senderAccount = ezMethodMatch[1].trim();
  }

  // Check for POS store name like "BEST MOBILE NITTAMBUWA"
  const storeMatch = rawText.match(/\b([A-Z\s]{3,30}(?:MOBILE|COMMUNICATION|STORES|TELECOM|AGENCY)[A-Z\s]*)\b/i);
  if (storeMatch && storeMatch[1]) {
    beneficiaryName = storeMatch[1].trim();
  }

  for (const line of lines) {
    // Sender / Source
    if (/(?:from\s*account|source\s*account|payer\s*account|sender)[\s:=–-]+(.+)/i.test(line)) {
      const m = line.match(/(?:from\s*account|source\s*account|payer\s*account|sender)[\s:=–-]+(.+)/i);
      if (m && m[1]) {
        const val = m[1].trim();
        if (/[0-9]{8,16}/.test(val)) senderAccount = val;
        else senderName = val;
      }
    }
    // Beneficiary / Destination
    if (/(?:to\s*account|beneficiary\s*account|payee\s*account)[\s:=–-]+(.+)/i.test(line)) {
      const m = line.match(/(?:to\s*account|beneficiary\s*account|payee\s*account)[\s:=–-]+(.+)/i);
      if (m && m[1]) beneficiaryAccount = m[1].trim();
    }
    if (/(?:beneficiary\s*name|payee\s*name|beneficiary)[\s:=–-]+(.+)/i.test(line)) {
      const m = line.match(/(?:beneficiary\s*name|payee\s*name|beneficiary)[\s:=–-]+(.+)/i);
      if (m && m[1]) beneficiaryName = m[1].trim();
    }
  }

  // 7. Detect Sri Lankan phone number (with specific eZ Cash Geweema / Mobile Number labels)
  let customerPhone = '';
  const ezPhoneMatch = rawText.match(
    /(?:geweema|mobile\s*number|number|recipient|customer\s*phone)[\s:=–-]+(?:(?:\+?94)|0)?\s*([0-9\s]{9,15})/i
  );
  if (ezPhoneMatch && ezPhoneMatch[1]) {
    const digitsOnly = ezPhoneMatch[1].replace(/[^0-9]/g, '');
    const clean = digitsOnly.startsWith('94') ? digitsOnly.slice(2) : digitsOnly;
    if (clean.length === 9) {
      customerPhone = `0${clean}`;
    } else if (clean.length === 10) {
      customerPhone = clean;
    }
  }

  if (!customerPhone) {
    const phoneMatch = rawText.match(/(?:(?:\+?94)|0)?(7[01245678][0-9]{7})\b/);
    if (phoneMatch && phoneMatch[1]) {
      customerPhone = `0${phoneMatch[1]}`;
    }
  }

  // If beneficiaryAccount is empty for eZ cash, use customerPhone
  if (!beneficiaryAccount && customerPhone && detectedBankId === 'ez_cash') {
    beneficiaryAccount = customerPhone;
  }

  // Count detected core fields for quality assessment
  let detectedCount = 0;
  if (detectedBankId !== 'other') detectedCount++;
  if (detectedAmount !== null) detectedCount++;
  if (detectedDate) detectedCount++;
  if (detectedRef) detectedCount++;
  if (beneficiaryName || beneficiaryAccount || customerPhone) detectedCount++;

  // Calculate overall confidence combining OCR quality and field recognition
  const finalConfidence = Math.min(
    99,
    Math.max(45, Math.round(ocrConfidence * 0.6 + (detectedCount / 5) * 40))
  );

  return {
    bankId: detectedBankId,
    bankName,
    amount: detectedAmount,
    amountFormatted: formattedAmount || (detectedAmount ? detectedAmount.toFixed(2) : ''),
    currency: 'LKR',
    date: detectedDate,
    time: detectedTime,
    refNumber: detectedRef || generateFallbackRef(detectedBankId),
    senderAccount,
    senderName,
    customerPhone,
    beneficiaryAccount,
    beneficiaryName,
    confidence: finalConfidence,
    rawText,
    detectedFieldsCount: detectedCount,
  };
};

function normalizeDateString(rawDate: string): string {
  try {
    // Colon-separated date from POS terminal (e.g. 2026:10:02)
    const colondate = rawDate.match(new RegExp('^(202\\d):(\\d{1,2}):(\\d{1,2})$'));
    if (colondate) {
      const y = colondate[1];
      const m = colondate[2].padStart(2, '0');
      const d = colondate[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // If format is DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = rawDate.match(new RegExp('^(\\d{1,2})[-/.](\\d{1,2})[-/.](202\\d)$'));
    if (ddmmyyyy) {
      const d = ddmmyyyy[1].padStart(2, '0');
      const m = ddmmyyyy[2].padStart(2, '0');
      const y = ddmmyyyy[3];
      return `${y}-${m}-${d}`;
    }

    // If format is YYYY-MM-DD or YYYY/MM/DD
    const yyyymmdd = rawDate.match(new RegExp('^(202\\d)[-/.](\\d{1,2})[-/.](\\d{1,2})$'));
    if (yyyymmdd) {
      const y = yyyymmdd[1];
      const m = yyyymmdd[2].padStart(2, '0');
      const d = yyyymmdd[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  } catch {
    // Fall through
  }
  return rawDate.replace(/\//g, '-');
}

function generateFallbackRef(bankId: SupportedBankId): string {
  const prefix =
    bankId === 'ez_cash'
      ? 'EZ'
      : bankId === 'mcash'
      ? 'MCASH'
      : bankId === 'commercial'
      ? 'CB'
      : bankId === 'boc'
      ? 'BOC'
      : bankId === 'sampath'
      ? 'SV'
      : bankId === 'peoples'
      ? 'PB'
      : bankId === 'hnb'
      ? 'HNB'
      : 'REF';
  const random = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}-${random}`;
}
