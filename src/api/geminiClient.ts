/**
 * Client Gemini direct depuis le navigateur.
 * L'API Google AI supporte les appels CORS — pas besoin de serveur.
 *
 * Docs: https://ai.google.dev/gemini-api/docs
 */

import { config } from '../config';

export interface GeminiReceiptResult {
  merchantName: string;
  merchantAddress?: string;
  merchantVatNumber?: string;
  date: string;
  category: string;
  invoiceNumber?: string;
  currency: string;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalTTC: number;
  paymentMethod: string;
  confidenceScore: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    vatRate: number;
  }>;
}

const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

/**
 * Analyse une image de reçu via Gemini Vision (appel direct depuis le navigateur).
 */
export async function geminiParseReceipt(
  imageBase64: string,
  userApiKey?: string
): Promise<{ data: GeminiReceiptResult; model: string } | null> {
  const apiKey = userApiKey || config.geminiApiKey;
  if (!apiKey) return null;

  // Nettoyer le base64
  let cleanData = imageBase64;
  let mime = "image/jpeg";
  if (cleanData.includes(";base64,")) {
    const parts = cleanData.split(";base64,");
    const matchMime = parts[0].match(/data:(.*?);/);
    if (matchMime) mime = matchMime[1];
    cleanData = parts[1];
  }

  const promptText = `You are DocuSnap AI, an expert OCR invoice and receipt parser.
Analyze this invoice or receipt image carefully and extract all relevant structured bookkeeping information.
Return a valid JSON object matching the requested schema exactly.

Identify:
- Merchant Name
- Merchant Address (if present)
- Merchant VAT / SIRET / Tax ID (if present)
- Date of transaction (YYYY-MM-DD format)
- Category (one of: Hardware, Restaurant, Fuel, Transport, Office, Software, Travel, Services)
- Invoice / Receipt Number
- Currency (3 letters, e.g. EUR, USD, GBP)
- Subtotal (amount before VAT/Tax)
- Primary VAT / Tax Rate (%) (e.g. 20, 10, 5.5, 0)
- VAT / Tax Amount
- Total Amount TTC (including VAT)
- Payment Method (e.g. Corporate Visa **** 1234, Cash, Apple Pay)
- Confidence score (0 to 100)
- Line Items list with description, quantity, unit price, total price, and vat rate.`;

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              { inlineData: { mimeType: mime, data: cleanData } },
            ],
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                merchantName: { type: "STRING" },
                merchantAddress: { type: "STRING" },
                merchantVatNumber: { type: "STRING" },
                date: { type: "STRING" },
                category: { type: "STRING" },
                invoiceNumber: { type: "STRING" },
                currency: { type: "STRING" },
                subtotal: { type: "NUMBER" },
                vatRate: { type: "NUMBER" },
                vatAmount: { type: "NUMBER" },
                totalTTC: { type: "NUMBER" },
                paymentMethod: { type: "STRING" },
                confidenceScore: { type: "NUMBER" },
                lineItems: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      description: { type: "STRING" },
                      quantity: { type: "NUMBER" },
                      unitPrice: { type: "NUMBER" },
                      totalPrice: { type: "NUMBER" },
                      vatRate: { type: "NUMBER" },
                    },
                  },
                },
              },
            },
          },
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!resp.ok) continue; // Essaie le modèle suivant
      const result = await resp.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;

      const data = JSON.parse(text);
      return { data, model };
    } catch {
      continue; // Modèle suivant
    }
  }

  return null;
}

/**
 * Chat assistant via Gemini (texte sans image).
 */
export async function geminiChat(
  message: string,
  userApiKey?: string
): Promise<string | null> {
  const apiKey = userApiKey || config.geminiApiKey;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) return null;
    const result = await resp.json();
    return result?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}
