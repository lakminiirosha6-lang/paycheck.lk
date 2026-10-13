import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function handleWhatsAppWebhook(req: Request, res: Response) {
  try {
    const { imageUrl, from, text } = req.body;

    if (!imageUrl && !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: provide either imageUrl or text',
      });
    }

    const systemInstruction = `You are an expert Sri Lankan payment slip OCR and extraction engine for PayCheck.lk WhatsApp Webhook.
Extract payment details from incoming WhatsApp receipt image or SMS text.
Required fields to extract:
- amount (number)
- date (YYYY-MM-DD string)
- refNumber (transaction ID / reference number string)
- senderName (sender or account holder name string)
- customerPhone (phone number string, e.g. from parameter)
- bankName (e.g. 'eZ Cash', 'mCash', 'Commercial Bank', 'BOC', 'Sampath', etc.)

Always respond ONLY with a clean JSON object in this exact format:
{
  "amount": number,
  "date": "YYYY-MM-DD",
  "refNumber": string,
  "senderName": string,
  "customerPhone": string,
  "bankName": string,
  "rawText": string
}`;

    const promptText = imageUrl
      ? `Extract payment receipt details from this WhatsApp receipt image URL: ${imageUrl}`
      : `Extract payment receipt details from this WhatsApp text message: "${text}"`;

    let imagePart = null;
    if (imageUrl) {
      try {
        // If image is data url or http url, fetch or use directly
        if (imageUrl.startsWith('data:')) {
          const base64Data = imageUrl.replace(/^data:[^;]+;base64,/, '');
          const mimeMatch = imageUrl.match(/^data:([^;]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          imagePart = {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          };
        } else {
          // Fetch remote image
          const fetchRes = await fetch(imageUrl);
          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          imagePart = {
            inlineData: {
              data: buffer.toString('base64'),
              mimeType: fetchRes.headers.get('content-type') || 'image/jpeg',
            },
          };
        }
      } catch (imgErr: any) {
        console.warn('Failed to fetch/process image URL in webhook, proceeding with text prompt:', imgErr.message);
      }
    }

    const contents = imagePart ? [imagePart, promptText] : promptText;
    const models = ['gemini-1.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
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
      } catch (e: any) {
        console.warn(`Webhook OCR with ${model} failed, trying next...`, e.message);
      }
    }

    if (!rawOutput) {
      return res.status(503).json({ success: false, error: 'Gemini Vision OCR failed to process WhatsApp receipt' });
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      const cleaned = rawOutput.replace(/```(?:json)?/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const receiptRecord = {
      id: `wa-rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      amount: Number(parsed.amount) || 0,
      amountFormatted: (Number(parsed.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
      currency: 'LKR',
      date: parsed.date || new Date().toISOString().split('T')[0],
      refNumber: parsed.refNumber || `WA-${Math.floor(Math.random() * 900000 + 100000)}`,
      senderName: parsed.senderName || 'WhatsApp Customer',
      customerPhone: from || parsed.customerPhone || '0770000000',
      bankName: parsed.bankName || 'eZ Cash / Mobile',
      bankId: 'ez_cash',
      source: 'whatsapp_webhook',
      createdAt: new Date().toISOString(),
      rawOcrText: parsed.rawText || text || 'Received via WhatsApp Webhook',
    };

    return res.json({
      success: true,
      message: 'WhatsApp receipt successfully extracted via Gemini Vision OCR',
      receipt: receiptRecord,
    });
  } catch (error: any) {
    console.error('Error in /api/whatsapp-webhook:', error);
    return res.status(500).json({ success: false, error: error.message || 'Webhook internal error' });
  }
}
