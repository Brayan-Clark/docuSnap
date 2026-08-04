/**
 * DocuSnap AI — Moteur OCR 100% gratuit (zéro clé API, zéro abonnement).
 *
 * Pipeline : image (base64 / data-URL / SVG) → sharp (rasterisation PNG)
 * → Tesseract.js (reconnaissance) → extraction structurée par règles.
 *
 * Utilisé automatiquement quand GEMINI_API_KEY est absente ou en cas d'erreur
 * de l'API Gemini. Permet à l'application d'être pleinement opérationnelle
 * sans aucun compte ni clé.
 */

import sharp from "sharp";
import { createWorker } from "tesseract.js";

export interface OcrLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number;
}

export interface OcrReceipt {
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
  lineItems: OcrLineItem[];
}

// ---------------------------------------------------------------------------
// Préparation de l'image
// ---------------------------------------------------------------------------

/** Convertit n'importe quel input (data-URL SVG utf8/base64, base64 brut) en buffer PNG. */
export async function imageToPngBuffer(input: string): Promise<Buffer> {
  let raw: Buffer;
  let isSvg = false;

  if (/^data:image\/svg\+xml;utf8,/i.test(input)) {
    isSvg = true;
    raw = Buffer.from(decodeURIComponent(input.slice(input.indexOf(",") + 1)), "utf8");
  } else if (/^data:image\/svg\+xml;base64,/i.test(input)) {
    isSvg = true;
    raw = Buffer.from(input.slice(input.indexOf(",") + 1), "base64");
  } else if (input.includes(";base64,")) {
    raw = Buffer.from(input.split(";base64,")[1], "base64");
  } else {
    raw = Buffer.from(input, "base64");
  }

  if (isSvg) {
    // Rasterisation à haute densité pour garder les petits textes lisibles.
    return sharp(raw, { density: 220 }).png().toBuffer();
  }
  // Normalisation + validation du raster (corrige aussi l'orientation EXIF).
  return sharp(raw).rotate().png().toBuffer();
}

// ---------------------------------------------------------------------------
// Helpers de parsing
// ---------------------------------------------------------------------------

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const pad = (n: number | string): string => String(n).padStart(2, "0");

/** Normalise un jeton d'argent ("86,00", "86.00", "1.234,56", "1,234.56") → nombre. */
function normalizeAmountToken(tok: string): number | null {
  let s = tok.replace(/[\s  ]/g, "").trim();
  if (!s) return null;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  const decSep = lastDot >= 0 || lastComma >= 0
    ? (lastDot > lastComma ? "." : ",")
    : null;

  if (decSep) {
    const decIdx = decSep === "." ? lastDot : lastComma;
    const decPart = s.slice(decIdx + 1);
    // Séparateur décimal uniquement si 1-2 chiffres après
    if (/^\d{1,2}$/.test(decPart)) {
      const intNorm = s.slice(0, decIdx).replace(/[.,]/g, "");
      const n = parseFloat(intNorm + "." + decPart);
      return Number.isFinite(n) ? n : null;
    }
    // Sinon c'est un séparateur de milliers → on l'enlève
    s = s.slice(0, decIdx) + s.slice(decIdx + 1);
  }
  s = s.replace(/[.,]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

const AMOUNT_TOKEN_RE = /\d{1,3}(?:[.,\s  ]\d{3})*(?:[.,]\d{1,2})?/g;

/** Extrait TOUS les montants d'une ligne sans jamais en fusionner deux. */
function matchAmountTokens(raw: string): number[] {
  const tokens: number[] = [];
  const re = new RegExp(AMOUNT_TOKEN_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const v = normalizeAmountToken(m[0]);
    if (v !== null) tokens.push(v);
  }
  return tokens;
}

/** Parse une ligne → dernier montant présent. */
function parseAmount(raw: string): number | null {
  const tokens = matchAmountTokens(raw);
  return tokens.length ? tokens[tokens.length - 1] : null;
}

const FR_MONTHS: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4,
  mai: 5, juin: 6, juillet: 7, août: 8, aout: 8, septembre: 9,
  octobre: 10, novembre: 11, décembre: 12, decembre: 12,
  jan: 1, janv: 1, feb: 2, fev: 2, mar: 3, apr: 4, avr: 4,
  may: 5, jun: 6, juil: 7, jul: 7, aug: 8, aoû: 8, aou: 8,
  sep: 9, sept: 9, oct: 10, nov: 11, dec: 12, déc: 12,
};

function monthNumber(token: string): number | null {
  const key = token.toLowerCase().replace(/\.$/, "");
  return FR_MONTHS[key] ?? null;
}

/** Reconnaît une date dans plusieurs formats et la normalise en YYYY-MM-DD. */
export function parseDate(raw: string): string | null {
  let m = raw.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;

  m = raw.match(/\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})\b/);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;

  m = raw.match(/\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{2})\b/);
  if (m) return `20${m[3]}-${pad(m[2])}-${pad(m[1])}`;

  m = raw.match(/\b(\d{1,2})\s+([A-Za-zÀ-ÿéè]+)\.?\s+(\d{4})\b/i);
  if (m) {
    const month = monthNumber(m[2]);
    if (month) return `${m[3]}-${pad(month)}-${pad(m[1])}`;
  }
  return null;
}

const CATEGORY_KEYWORDS: Array<[string, RegExp]> = [
  ["Restaurant", /(restaurant|bistrot|cafe|coffee|starbucks|bar|brasserie|pizzeria|boulangerie|lunch|dejeuner|diner)/i],
  ["Fuel", /(fuel|essence|carburant|gazole|petrol|gas station|station-service|totalenergies|excellium)/i],
  ["Transport", /(uber|taxi|lyft|sncf|train|metro|parking|peage|toll|autoroute|gare|lyon)/i],
  ["Travel", /(hotel|hilton|airbnb|booking|voyage|flight|avion|séjour)/i],
  ["Software", /(software|adobe|microsoft|aws|azure|cloud|license|subscription|saas)/i],
  ["Office", /(office|papier|stationery|fourniture|encre|toner|cartouche)/i],
  ["Hardware", /(leroy|merlin|bricolage|quincaillerie|outil|hardware|perceuse|castorama|bricomarche|cheville|ruban)/i],
  ["Services", /(services|consulting|conseil|maintenance|prestataire)/i],
];

function inferCategory(text: string): string {
  for (const [cat, re] of CATEGORY_KEYWORDS) {
    if (re.test(text)) return cat;
  }
  return "Services";
}

const CURRENCY_RE = /\b(EUR|USD|GBP|CHF|CAD|AUD|JPY)\b/i;

const PAYMENT_RE = /(corporate|business|company|fleet|visa|mastercard|master\s?card|amex|american express|apple pay|google pay|contactless|paypal|wechat)/i;

// ---------------------------------------------------------------------------
// Cœur : analyse du texte OCR → structure comptable
// ---------------------------------------------------------------------------

export function parseReceiptText(rawText: string, ocrConfidence: number): OcrReceipt {
  const text = rawText.replace(/\r/g, "").replace(/\s*\n\s*/g, "\n").trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const lineContainsOnlyNoise = (l: string) =>
    !l || /^(sir?et|tva|vat|date|article|item|qty|qté|desc|total\b|montant\b|ht\b|tic|tva\(|reference|réf|ticket|invoice|bill|facture)/i.test(l);

  // --- Marchand ---
  let merchantName = "Extracted Merchant";
  for (const l of lines) {
    const cleaned = l.replace(/[|•·—_-]+$/, "").trim();
    if (!cleaned) continue;
    if (/^[\d.,€\s%]+$/.test(cleaned)) continue; // ligne de chiffres uniquement
    if (lineContainsOnlyNoise(cleaned)) continue;
    if (/\d{5,}/.test(cleaned) && /(siret|tva|vat)/i.test(cleaned)) continue;
    if (/(siret|tva|vat|tel|s.a.r.l|sas|date)/i.test(cleaned) && !/[A-Z]{2,}/.test(cleaned.replace(/\d/g, ""))) continue;
    merchantName = cleaned.replace(/[.,;:]+$/, "").trim() || "Extracted Merchant";
    break;
  }

  // --- Adresse ---
  const addressRe = /(rue|avenue|av\.?|bd|boulevard|chemin|route|place|quai|allée|allee|immeuble|lot|zone|km|street|rd|blvd|drive|ave)\b.*\d|[A-ZÀ-ÿ' -]+[\d, ]{4,}\s+[A-ZÀ-ÿ -]+/i;
  let merchantAddress: string | undefined;
  for (const l of lines) {
    if (/(siret|tva|vat|n°|nº|tel|fax|date)/i.test(l)) continue;
    if (/\b\d{5}\b/.test(l) || (addressRe.test(l) && /\d/.test(l))) {
      merchantAddress = l.replace(/[|•·—_-]+$/, "").trim();
      break;
    }
  }

  // --- Numéro TVA / SIRET ---
  let merchantVatNumber: string | undefined;
  const vatMatch = text.match(/\b(?:TVA|VAT)\s*(?:N[°o]\s*)?[:#\- ]*\s*([A-Z]{2}\s?\d{2}\s?[\d\s]{6,14})/i)
    || text.match(/\b([A-Z]{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{3})\b/i);
  if (vatMatch) merchantVatNumber = vatMatch[1].replace(/\s+/g, " ").trim();

  // --- Date ---
  const date = parseDate(text) || new Date().toISOString().split("T")[0];

  // --- Numéro de facture ---
  let invoiceNumber: string | undefined;
  const invMatch = text.match(
    /(?:INV|FAC|FA|REC|TICKET|BILL|REF|RÉF|N°|Nº)\s*[:#\-.]*\s*([A-Z0-9][A-Z0-9\-_/]{3,})/i
  );
  if (invMatch && /\d/.test(invMatch[1]) && !/TOTAL/i.test(invMatch[0])) {
    invoiceNumber = invMatch[1].trim().toUpperCase();
  }

  // --- Devise ---
  const curMatch = text.match(CURRENCY_RE);
  const currency = (curMatch?.[1] ?? "EUR").toUpperCase();

  // --- Totaux (lignes clés) ---
  let totalTTC = 0;
  let vatAmount = 0;
  let vatRate = 20;
  let rateFound = false;
  let subtotal = 0;
  let totalFound = false;

  for (const l of lines) {
    if (/total\s*(?:ttc|a?payer|net|due|t\.?t\.?c|général|general)/i.test(l)) {
      const n = parseAmount(l);
      if (n) { totalTTC = n; totalFound = true; }
    }
    if (/(?:tva|vat|tax)/i.test(l) && !/total/i.test(l)) {
      const rateMatch = l.match(/\(?\s*(\d{1,3}(?:[.,]\d)?)\s*%\)?/i);
      if (rateMatch) {
        const r = normalizeAmountToken(rateMatch[1]);
        if (r !== null && r <= 60) {
          vatRate = r;
          rateFound = true;
        }
      }
      const n = parseAmount(l);
      if (n !== null) vatAmount = n;
    }
  }

  if (!totalFound) {
    // Repli : plus grand montant isolé du texte.
    const amounts = lines.map(parseAmount).filter((n): n is number => n !== null);
    if (amounts.length) totalTTC = Math.max(...amounts);
  }

  // Montant HT
  for (const l of lines) {
    if (/(?:montant\s*ht|sous[- ]total|subtotal|ht\s*[:#])/i.test(l)) {
      const n = parseAmount(l);
      if (n) { subtotal = n; break; }
    }
  }
  if (!subtotal && totalTTC && vatAmount) subtotal = totalTTC - vatAmount;
  if (!subtotal) subtotal = totalTTC;

  // Déduire le taux si non précisé explicitement
  if (!rateFound && subtotal > 0 && vatAmount > 0 && Math.abs((vatAmount / subtotal) * 100 - vatRate) > 1.5) {
    const computed = (vatAmount / subtotal) * 100;
    vatRate = Math.round(computed * 10) / 10;
  }

  // --- Moyen de paiement ---
  let paymentMethod = "Corporate Card";
  const payLine = lines.find((l) => PAYMENT_RE.test(l));
  if (payLine) {
    const cardDigits = payLine.match(/(?:\*{2,}|\d{4})\s*(\d{4})/);
    const brand = (payLine.match(/visa|mastercard|master card|amex|american express/i)?.[0] ?? "Corporate");
    paymentMethod = `Corporate ${brand.charAt(0).toUpperCase() + brand.slice(1)}${cardDigits ? ` **** ${cardDigits[1]}` : ""}`;
  }

  // --- Lignes d'article ---
  const lineItems: OcrLineItem[] = [];
  for (const l of lines) {
    if (/^(article|item|qty|qté|desc|total\b|montant\b|ht\b|tic|tva|vat|siret|date|n°|no\.?|ref|réf|ticket|invoice|bill)/i.test(l)) continue;
    if (/^(sous[- ]total|subtotal)/i.test(l)) continue;

    const amounts = matchAmountTokens(l);
    if (amounts.length === 0) continue;

    const lastAmt = amounts[amounts.length - 1];
    if (lastAmt <= 0) continue;

    // Retirer le montant de fin pour obtenir la description
    let description = l.replace(/\s*[\d.,]{1,9}\s*(?:EUR|€)?\s*$/i, "").trim();
    let quantity = 1;

    // Préfixe quantité "2x", "2 X", "2 x"
    const qtyMatch = description.match(/^(\d+(?:[.,]\d+)?)\s*[xX×]\s*/);
    if (qtyMatch) {
      quantity = parseAmount(qtyMatch[1]) ?? 1;
      description = description.slice(qtyMatch[0].length).trim();
    }

    if (!description || /^[.\-—•|]*$/.test(description)) continue;
    if (/\b(?:total|ttc|montant|tva|sous[- ]total)\b/i.test(description) && amounts.length <= 1) continue;

    // Si plusieurs montants, le dernier est le total ligne
    const unitPrice = quantity > 0 ? lastAmt / quantity : lastAmt;
    lineItems.push({
      id: "li-ocr-" + Date.now() + "-" + lineItems.length,
      description: description.slice(0, 60),
      quantity: Math.round(quantity * 100) / 100,
      unitPrice: Math.round(unitPrice * 100) / 100,
      totalPrice: Math.round(lastAmt * 100) / 100,
      vatRate,
    });
  }

  // Déduplication grossière des lignes (totaux répétés)
  const uniqueItems: OcrLineItem[] = [];
  const seen = new Set<string>();
  for (const it of lineItems) {
    const key = `${it.description}|${it.totalPrice}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(it);
    }
  }
  if (!uniqueItems.length) {
    uniqueItems.push({
      id: "li-ocr-" + Date.now(),
      description: "Processed Expense Document",
      quantity: 1,
      unitPrice: Math.round(totalTTC * 100) / 100,
      totalPrice: Math.round(totalTTC * 100) / 100,
      vatRate,
    });
  }

  // --- Confiance ---
  let confidence = clamp(Math.round(ocrConfidence || 0), 0, 99);
  if (merchantName !== "Extracted Merchant") confidence += 10;
  if (totalFound) confidence += 10;
  if (vatAmount > 0) confidence += 5;
  if (date) confidence += 5;
  if (lineItems.length > 1) confidence += 5;
  confidence = clamp(confidence, 0, 99);

  return {
    merchantName,
    merchantAddress,
    merchantVatNumber,
    date,
    category: inferCategory(text),
    invoiceNumber,
    currency,
    subtotal: Math.round(subtotal * 100) / 100,
    vatRate,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalTTC: Math.round(totalTTC * 100) / 100,
    paymentMethod,
    confidenceScore: confidence,
    lineItems: uniqueItems,
  };
}

// ---------------------------------------------------------------------------
// Worker Tesseract (singleton, réutilisé entre requêtes)
// ---------------------------------------------------------------------------

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

let workerPromise: Promise<TesseractWorker> | null = null;

function getWorker(): Promise<TesseractWorker> {
  if (!workerPromise) {
    workerPromise = createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && (m.progress * 100) % 25 < 2) {
          console.log(`[tesseract] OCR ${Math.round(m.progress * 100)}%`);
        }
      },
    }).catch((err) => {
      // Réinitialise la promesse pour pouvoir réessayer au prochain appel.
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

/** Exécute l'OCR local complet et retourne la structure + texte brut. */
export async function runLocalOcr(imageBase64: string): Promise<{ receipt: OcrReceipt; rawText: string }> {
  const png = await imageToPngBuffer(imageBase64);
  const worker = await getWorker();
  // `recognize` accepte un Buffer à l'exécution (Node adapter loadImage).
  const { data } = await worker.recognize(Buffer.from(png) as unknown as string);
  const receipt = parseReceiptText(data.text, data.confidence);
  return { receipt, rawText: data.text };
}
