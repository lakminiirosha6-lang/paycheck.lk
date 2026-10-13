export interface WhatsAppShareData {
  amount: number | string;
  amountFormatted?: string;
  bankName: string;
  refNumber: string;
  date: string;
}

export const generateWhatsAppVerificationText = (record: WhatsAppShareData): string => {
  const amt =
    record.amountFormatted ||
    (typeof record.amount === 'number'
      ? record.amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : record.amount);

  return `✅ Verified via PayCheck.lk - Amount: Rs. ${amt}, Bank: ${record.bankName}, Ref: ${record.refNumber}, Date: ${record.date}`;
};

export const shareOnWhatsApp = (record: WhatsAppShareData): void => {
  const message = generateWhatsAppVerificationText(record);
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
