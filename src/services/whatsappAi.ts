import { ReceiptRecord } from '../types';

export interface ExcludedContact {
  id: string;
  name: string;
  phone: string;
  reason?: string;
  addedAt: string;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  lastMessageSent?: string;
}

export interface AutoReplySettings {
  isEnabled: boolean;
  businessName: string;
  customRules: string;
  defaultTone: 'polite' | 'friendly' | 'formal' | 'urgent';
  autoSignature: string;
}

const EXCLUDED_STORAGE_KEY = 'paycheck_whatsapp_excluded_v1';
const SETTINGS_STORAGE_KEY = 'paycheck_whatsapp_settings_v1';
const CONTACTS_STORAGE_KEY = 'paycheck_whatsapp_contacts_v1';

export const getExcludedContacts = (): ExcludedContact[] => {
  try {
    const data = localStorage.getItem(EXCLUDED_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return [
    {
      id: 'ex-1',
      name: 'Blocked Scammer / Duplicate Tester',
      phone: '0712345678',
      reason: 'Frequent invalid slip submitter',
      addedAt: new Date().toISOString(),
    },
  ];
};

export const saveExcludedContacts = (contacts: ExcludedContact[]): void => {
  try {
    localStorage.setItem(EXCLUDED_STORAGE_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.error(e);
  }
};

export const isContactExcluded = (phone: string, name?: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const list = getExcludedContacts();
  return list.some((item) => {
    const itemClean = item.phone.replace(/[^0-9]/g, '');
    const phoneMatch = itemClean && cleanPhone.includes(itemClean);
    const nameMatch = name && item.name.toLowerCase().trim() === name.toLowerCase().trim();
    return phoneMatch || nameMatch;
  });
};

export const getAutoReplySettings = (): AutoReplySettings => {
  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return {
    isEnabled: true,
    businessName: 'My Store / Lanka Business',
    customRules: 'ස්තුතිවන්ත වෙන්න, බැංකු රිසිට්පත තහවුරු කළ බව පවසන්න, සහ අදම පැකේජය කුරියර් කරන බව දන්වන්න.',
    defaultTone: 'friendly',
    autoSignature: 'Thank you for shopping with us! | PayCheck.lk Verification',
  };
};

export const saveAutoReplySettings = (settings: AutoReplySettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
};

export const getSavedContacts = (): WhatsAppContact[] => {
  try {
    const data = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return [
    { id: 'c-1', name: 'Nisal Perera', phone: '0771234567' },
    { id: 'c-2', name: 'Sunil Traders', phone: '0719876543' },
  ];
};

export const saveContact = (contact: Omit<WhatsAppContact, 'id'>): WhatsAppContact => {
  const contacts = getSavedContacts();
  const existing = contacts.find((c) => c.phone.replace(/[^0-9]/g, '') === contact.phone.replace(/[^0-9]/g, ''));
  if (existing) {
    existing.name = contact.name;
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    return existing;
  }
  const newContact: WhatsAppContact = {
    id: `c-${Date.now()}`,
    ...contact,
  };
  contacts.unshift(newContact);
  localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  return newContact;
};

// Format Sri Lankan number into international WhatsApp format (e.g. 0771234567 -> 94771234567)
export const formatSriLankanWhatsAppNumber = (phone: string): string => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '94' + cleaned.slice(1);
  } else if (!cleaned.startsWith('94') && cleaned.length === 9) {
    cleaned = '94' + cleaned;
  }
  return cleaned;
};

// Dispatch WhatsApp message via API
export const sendWhatsAppMessage = (phone: string, message: string): void => {
  const formattedNumber = formatSriLankanWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(message);
  const url = formattedNumber
    ? `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Call server-side Gemini AI to generate custom WhatsApp message
export const generateAiWhatsAppMessage = async (params: {
  receipt?: ReceiptRecord | null;
  tone?: string;
  userPrompt?: string;
  customerName?: string;
  language: 'en' | 'si';
}): Promise<string> => {
  const res = await fetch('/api/ai/generate-whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate message from Gemini AI');
  }

  return data.message;
};

// Call server-side Gemini AI to generate automated customer auto-reply
export const generateAiAutoReply = async (params: {
  incomingMessage: string;
  customerPhone?: string;
  customerName?: string;
  recentReceipts: ReceiptRecord[];
  customRules?: string;
  language: 'en' | 'si';
}): Promise<string> => {
  const res = await fetch('/api/ai/auto-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate auto-reply from Gemini AI');
  }

  return data.reply;
};
