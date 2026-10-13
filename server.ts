import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK with server-side API Key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resilient helper to call Gemini with multi-model fallback
async function generateWithGeminiFallback(contents: string, systemInstruction: string): Promise<string> {
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next fallback...`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models unavailable');
}

// Fallback message generator if API quota / 503 spike occurs
function generateRuleBasedWhatsAppMessage(params: {
  receipt?: any;
  tone?: string;
  userPrompt?: string;
  customerName?: string;
  language?: string;
}): string {
  const { receipt, userPrompt, customerName = 'Customer', language = 'si' } = params;
  const isSinhala = language === 'si';

  if (isSinhala) {
    let msg = `ආයුබෝවන් ${customerName} මහතාණෙනි/මියණෙනි, 🙏\n\n`;
    if (receipt) {
      msg += `ඔබ විසින් සිදුකළ ගෙවීම සාර්ථකව තහවුරු කරන ලදී! ✅\n`;
      msg += `🧾 *බැංකුව:* ${receipt.bankName || 'Bank'}\n`;
      msg += `💰 *මුදල:* Rs. ${receipt.amountFormatted || receipt.amount || '0.00'}\n`;
      msg += `🔢 *Ref No:* ${receipt.refNumber || 'N/A'}\n`;
      msg += `📅 *දිනය:* ${receipt.date || new Date().toISOString().split('T')[0]}\n\n`;
    }
    if (userPrompt) {
      msg += `📌 *විශේෂ සටහන:* ${userPrompt}\n\n`;
    } else {
      msg += `ඔබගේ ඇණවුම කඩිනමින් ක්‍රියාත්මක කෙරේ.\n\n`;
    }
    msg += `ස්තුතියි! ඔබට සුබ දවසක් වේවා! ✨\n- PayCheck.lk Verified`;
    return msg;
  } else {
    let msg = `Hello ${customerName}, 🙏\n\n`;
    if (receipt) {
      msg += `Your bank payment has been successfully verified! ✅\n`;
      msg += `🧾 *Bank:* ${receipt.bankName || 'Bank'}\n`;
      msg += `💰 *Amount:* Rs. ${receipt.amountFormatted || receipt.amount || '0.00'}\n`;
      msg += `🔢 *Ref No:* ${receipt.refNumber || 'N/A'}\n`;
      msg += `📅 *Date:* ${receipt.date || new Date().toISOString().split('T')[0]}\n\n`;
    }
    if (userPrompt) {
      msg += `📌 *Merchant Note:* ${userPrompt}\n\n`;
    } else {
      msg += `Your order is currently being processed for delivery.\n\n`;
    }
    msg += `Thank you for your business! ✨\n- Verified via PayCheck.lk`;
    return msg;
  }
}

// Fallback auto-reply generator
function generateRuleBasedAutoReply(params: {
  incomingMessage: string;
  customerName?: string;
  recentReceipts?: any[];
  customRules?: string;
  language?: string;
}): string {
  const { incomingMessage, customerName = 'Customer', recentReceipts = [], customRules, language = 'si' } = params;
  const isSinhala = language === 'si' || incomingMessage.match(/[\u0D80-\u0DFF]/);

  const matchedReceipt = recentReceipts[0];

  if (isSinhala) {
    let reply = `ආයුබෝවන් ${customerName}, 🙏\n\n`;
    if (matchedReceipt) {
      reply += `ඔබ එවූ ගෙවීම් විස්තර අපගේ පද්ධතියෙන් සාර්ථකව පරීක්ෂා කර තහවුරු කර ඇත. ✅\n`;
      reply += `🧾 *බැංකුව:* ${matchedReceipt.bankName}\n`;
      reply += `💰 *මුදල:* Rs. ${matchedReceipt.amountFormatted || matchedReceipt.amount}\n`;
      reply += `🔢 *Reference No:* ${matchedReceipt.refNumber}\n\n`;
      reply += `ඔබගේ පාර්සලය අද/හෙට කඩිනමින් කුරියර් සේවාව වෙත භාරදෙනු ලැබේ. 📦\n\n`;
    } else {
      reply += `ඔබගේ පණිවිඩය අප වෙත ලැබුණි. ඔබ එවූ රිසිට්පත මේ වන විට අපගේ කණ්ඩායම විසින් පරීක්ෂා කරමින් පවතී. සුළු මොහොතකින් තහවුරු කිරීමේ පණිවිඩයක් එවන්නෙමු. ⏳\n\n`;
    }
    if (customRules) {
      reply += `📌 *දැනුම්දීම:* ${customRules}\n\n`;
    }
    reply += `ස්තුතියි! ඔබට සුබ දවසක්! 🙏`;
    return reply;
  } else {
    let reply = `Hello ${customerName}, 🙏\n\n`;
    if (matchedReceipt) {
      reply += `We have verified your payment receipt in our system! ✅\n`;
      reply += `🧾 *Bank:* ${matchedReceipt.bankName}\n`;
      reply += `💰 *Amount:* Rs. ${matchedReceipt.amountFormatted || matchedReceipt.amount}\n`;
      reply += `🔢 *Reference No:* ${matchedReceipt.refNumber}\n\n`;
      reply += `Your order is scheduled for dispatch shortly. 📦\n\n`;
    } else {
      reply += `Thank you for reaching out! We have received your slip and our verification team is currently verifying the transfer. We will update you shortly. ⏳\n\n`;
    }
    if (customRules) {
      reply += `📌 *Notice:* ${customRules}\n\n`;
    }
    reply += `Thank you! Have a great day! 🙏`;
    return reply;
  }
}

// API Route: AI WhatsApp Message Generator
app.post('/api/ai/generate-whatsapp', async (req: Request, res: Response) => {
  try {
    const { receipt, tone, userPrompt, customerName, language } = req.body;

    const receiptInfo = receipt
      ? `Receipt Details:
Bank: ${receipt.bankName}
Amount: Rs. ${receipt.amountFormatted || receipt.amount}
Date: ${receipt.date}
Reference No: ${receipt.refNumber}
Sender: ${receipt.senderName || receipt.senderAccount || 'Customer'}
Beneficiary: ${receipt.beneficiaryName || receipt.beneficiaryAccount || 'Merchant'}`
      : 'No specific receipt attached.';

    const systemInstruction = `You are a professional customer support assistant for a Sri Lankan business using PayCheck.lk.
Your task is to draft a polite, clear, and high-converting WhatsApp message to a customer regarding payment or receipt verification.
Use appropriate Sri Lankan business etiquette. If the language is Sinhala ('si'), write natural, courteous Sinhala (with polite terms like 'ආයුබෝවන්', 'ස්තුතියි', 'ගෙවීම් තහවුරු කළා'). If English ('en'), write professional friendly English.
Format with clean WhatsApp Markdown (bold with *text*, emojis where appropriate like ✅, 🧾, 🙏).
Do NOT include unfilled bracket placeholders like [Your Name]; make it ready to copy and send.`;

    const prompt = `Customer Name: ${customerName || 'Customer'}
Language: ${language === 'si' ? 'Sinhala' : 'English'}
Message Tone: ${tone || 'Polite & Professional'}
User Specific Instructions: ${userPrompt || 'Confirm that their bank receipt is verified successfully and thank them for the payment.'}

${receiptInfo}

Please write the complete WhatsApp message text now:`;

    try {
      const generatedText = await generateWithGeminiFallback(prompt, systemInstruction);
      return res.json({ success: true, message: generatedText, source: 'gemini' });
    } catch (modelErr: any) {
      console.warn('Gemini model call failed, falling back to rule-based engine:', modelErr.message);
      const fallbackText = generateRuleBasedWhatsAppMessage({
        receipt,
        tone,
        userPrompt,
        customerName,
        language,
      });
      return res.json({ success: true, message: fallbackText, source: 'fallback' });
    }
  } catch (error: any) {
    console.error('Error generating WhatsApp message:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate message.',
    });
  }
});

// API Route: AI Auto-Reply Generator for incoming customer query
app.post('/api/ai/auto-reply', async (req: Request, res: Response) => {
  try {
    const { incomingMessage, customerPhone, customerName, recentReceipts, customRules, language } = req.body;

    const receiptsContext = Array.isArray(recentReceipts) && recentReceipts.length > 0
      ? recentReceipts.slice(0, 5).map((r: any) => 
          `- Ref: ${r.refNumber}, Bank: ${r.bankName}, Amount: Rs. ${r.amountFormatted || r.amount}, Date: ${r.date}, Sender: ${r.senderName || ''}`
        ).join('\n')
      : 'No verified receipts records found in memory.';

    const systemInstruction = `You are an automated AI WhatsApp Auto-Responder for a Sri Lankan merchant using PayCheck.lk.
Analyze the customer's incoming message and draft an intelligent, accurate, and reassuring auto-reply.
- If they ask whether their payment/receipt was received or verified, look at the recent receipts provided in the context to verify if a matching amount or ref exists.
- If matching receipt exists, enthusiastically confirm it with reference number and thank them.
- If no match exists or receipt is pending, politely inform them that you are reviewing their slip and will update them shortly.
- If custom business rules or instructions are provided, follow them strictly.
- Output clean WhatsApp formatted text (*bold*, emojis ✅, 📦, 🙏).
- Reply in ${language === 'si' ? 'polite Sinhala (සිංහල)' : 'natural English'} unless the incoming message is clearly in the other language.`;

    const prompt = `Customer Incoming Query: "${incomingMessage}"
Customer Name: ${customerName || 'Customer'}
Customer Phone: ${customerPhone || 'Unknown'}

Custom Merchant Rules: ${customRules || 'Be polite, confirm verified payments, and state that orders will be dispatched quickly.'}

Verified Receipts Context:
${receiptsContext}

Draft the optimal WhatsApp auto-reply to send to this customer:`;

    try {
      const replyText = await generateWithGeminiFallback(prompt, systemInstruction);
      return res.json({ success: true, reply: replyText, source: 'gemini' });
    } catch (modelErr: any) {
      console.warn('Gemini auto-reply model call failed, falling back to rule-based engine:', modelErr.message);
      const fallbackReply = generateRuleBasedAutoReply({
        incomingMessage,
        customerName,
        recentReceipts,
        customRules,
        language,
      });
      return res.json({ success: true, reply: fallbackReply, source: 'fallback' });
    }
  } catch (error: any) {
    console.error('Error generating auto-reply:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate auto-reply.',
    });
  }
});

// API Route: AI Receipt Extractor (Supports eZ Cash SMS, App screenshots, Thermal slips & Bank slips)
app.post('/api/ai/extract-receipt', async (req: Request, res: Response) => {
  try {
    const { text, imageBase64, mimeType } = req.body;

    if (!text && !imageBase64) {
      return res.status(400).json({ success: false, error: 'Provide text or imageBase64' });
    }

    const systemInstruction = `You are an expert Sri Lankan payment slip & receipt parser for PayCheck.lk.
You accurately extract details from Sri Lankan bank slips, mobile wallet transactions, and merchant printouts.
Supported entities:
- Mobile Wallets: 'ez_cash' (Dialog eZ Cash SMS, MyDialog App screenshots, POS receipts), 'mcash' (Mobitel mCash)
- Banks: 'commercial' (Commercial Bank), 'boc' (Bank of Ceylon), 'sampath' (Sampath Bank), 'nsb' (NSB), 'peoples' (People's Bank), 'hnb' (Hatton National Bank), 'other'

CRITICAL EZ CASH RULES:
1. eZ Cash SMS format (Dialog):
   - 'Shuddha geweema' or 'Labunu mudala' is the net payment amount. DO NOT pick 'Current Balance' as amount.
   - 'RN:...' is the reference number.
   - 'Geweema: <phone>' or '07xxxxxxxx' is customer phone.
2. eZ Cash App (MyDialog):
   - 'Total Amount Rs. ...' is amount.
   - 'Transaction ID ...' is ref number.
   - 'Mobile Number ...' is customer phone.
   - 'Payment Method eZ Cash ...' is sender account.
3. POS / Merchant Printouts:
   - Header like 'BEST MOBILE NITTAMBUWA' or 'COMMUNICATION' is merchant/beneficiary name.
   - 'Dialog EZ send money' -> 'ez_cash'.
   - 'Number: 07xxxxxxxx' -> customerPhone.
   - 'Amount: 600' -> amount.

Always respond ONLY with a clean JSON object conforming to:
{
  "bankId": "ez_cash" | "mcash" | "commercial" | "boc" | "sampath" | "nsb" | "peoples" | "hnb" | "other",
  "bankName": string,
  "amount": number,
  "currency": "LKR",
  "date": "YYYY-MM-DD",
  "time": string,
  "refNumber": string,
  "customerPhone": string,
  "senderName": string,
  "senderAccount": string,
  "beneficiaryName": string,
  "beneficiaryAccount": string,
  "confidence": number,
  "notes": string
}`;

    const promptText = text
      ? `Extract payment receipt details from this text:\n\n${text}`
      : `Extract payment receipt details from this image.`;

    const contents: any = imageBase64
      ? [
          {
            inlineData: {
              data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
              mimeType: mimeType || 'image/jpeg',
            },
          },
          promptText,
        ]
      : promptText;

    const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let rawOutput = '';

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });
        const out = response.text?.trim();
        if (out) {
          rawOutput = out;
          break;
        }
      } catch (err: any) {
        console.warn(`Extraction attempt with ${model} failed, trying next...`, err.message);
      }
    }

    if (!rawOutput) {
      return res.status(503).json({ success: false, error: 'AI models unavailable for extraction' });
    }

    try {
      const parsed = JSON.parse(rawOutput);
      return res.json({ success: true, data: parsed });
    } catch {
      // Clean JSON markers if present
      const cleaned = rawOutput.replace(/```(?:json)?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return res.json({ success: true, data: parsed });
    }
  } catch (err: any) {
    console.error('Error in /api/ai/extract-receipt:', err);
    return res.status(500).json({ success: false, error: err.message || 'Extraction failed' });
  }
});

// Mount Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`PayCheck.lk server running on http://localhost:${port}`);
  });
}

startServer();
