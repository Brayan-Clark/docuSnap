import { ReceiptData, PresetReceipt, WhatsAppMessage, IntegrationConfig, WebhookLog } from '../types';

// Helper to create clean SVG data URL for realistic receipt images
export const generateReceiptSvgUrl = (
  merchant: string,
  date: string,
  items: { desc: string; price: string }[],
  total: string,
  vat: string
): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="540" viewBox="0 0 380 540" fill="none">
    <!-- Receipt paper background with subtle zigzag edges -->
    <rect width="380" height="540" fill="#0F172A"/>
    <rect x="20" y="20" width="340" height="500" rx="8" fill="#FAFAFA" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.3))"/>
    
    <!-- Receipt Header -->
    <text x="190" y="60" text-anchor="middle" font-family="'Courier New', monospace" font-size="20" font-weight="bold" fill="#0F172A">${merchant.toUpperCase()}</text>
    <text x="190" y="80" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" fill="#64748B">SIRET: 849 204 192 00014 | TVA: FR 92 849204192</text>
    <text x="190" y="95" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" fill="#64748B">Date: ${date} - 14:32:08</text>

    <!-- Divider Line -->
    <line x1="40" y1="115" x2="340" y2="115" stroke="#CBD5E1" stroke-dasharray="4 4" stroke-width="1.5"/>

    <!-- Column Headers -->
    <text x="40" y="135" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#334155">ARTICLE</text>
    <text x="340" y="135" text-anchor="end" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#334155">TOTAL EUR</text>
    <line x1="40" y1="145" x2="340" y2="145" stroke="#CBD5E1" stroke-width="1"/>

    <!-- Items -->
    ${items
      .map(
        (item, idx) => `
      <text x="40" y="${170 + idx * 28}" font-family="'Courier New', monospace" font-size="12" fill="#1E293B">${item.desc}</text>
      <text x="340" y="${170 + idx * 28}" text-anchor="end" font-family="'Courier New', monospace" font-size="12" fill="#1E293B">${item.price}</text>
    `
      )
      .join('')}

    <!-- Divider Line -->
    <line x1="40" y1="${170 + items.length * 28 + 10}" x2="340" y2="${170 + items.length * 28 + 10}" stroke="#CBD5E1" stroke-dasharray="4 4" stroke-width="1.5"/>

    <!-- Totals Block -->
    <text x="40" y="${170 + items.length * 28 + 35}" font-family="'Courier New', monospace" font-size="12" fill="#64748B">MONTANT HT:</text>
    <text x="340" y="${170 + items.length * 28 + 35}" text-anchor="end" font-family="'Courier New', monospace" font-size="12" fill="#64748B">${(parseFloat(total) - parseFloat(vat)).toFixed(2)} €</text>

    <text x="40" y="${170 + items.length * 28 + 55}" font-family="'Courier New', monospace" font-size="12" fill="#64748B">TVA (20%):</text>
    <text x="340" y="${170 + items.length * 28 + 55}" text-anchor="end" font-family="'Courier New', monospace" font-size="12" fill="#64748B">${vat} €</text>

    <line x1="40" y1="${170 + items.length * 28 + 68}" x2="340" y2="${170 + items.length * 28 + 68}" stroke="#0F172A" stroke-width="2"/>

    <text x="40" y="${170 + items.length * 28 + 92}" font-family="'Courier New', monospace" font-size="16" font-weight="bold" fill="#0F172A">TOTAL TTC:</text>
    <text x="340" y="${170 + items.length * 28 + 92}" text-anchor="end" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#0284C7">${total} €</text>

    <!-- Footer Barcode simulation -->
    <rect x="70" y="440" width="240" height="35" fill="#0F172A"/>
    <text x="190" y="490" text-anchor="middle" font-family="'Courier New', monospace" font-size="10" fill="#94A3B8">DOCUMENT CERTIFIÉ DOCUSNAP OCR - #DS-892301</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_RECEIPTS: ReceiptData[] = [
  {
    id: 'rcpt-101',
    merchantName: 'Leroy Merlin Paris',
    merchantAddress: '159 Rue de Charenton, 75012 Paris',
    merchantVatNumber: 'FR 38 384920194',
    date: '2025-02-14',
    category: 'Hardware',
    invoiceNumber: 'INV-2025-0841',
    currency: 'EUR',
    subtotal: 154.17,
    vatRate: 20,
    vatAmount: 30.83,
    totalTTC: 185.00,
    paymentMethod: 'Corporate Visa **** 4912',
    confidenceScore: 98,
    status: 'verified',
    syncedToSheets: true,
    syncedToNotion: true,
    uploadedAt: '2025-02-14 15:20',
    imageUrl: generateReceiptSvgUrl(
      'Leroy Merlin Paris',
      '2025-02-14',
      [
        { desc: 'Perceuse Sans Fil 18V', price: '129.00' },
        { desc: 'Boite Chevilles Mix 200pcs', price: '16.00' },
        { desc: 'Mètre Ruban 5m Magnet', price: '40.00' }
      ],
      '185.00',
      '30.83'
    ),
    lineItems: [
      { id: 'li-1', description: 'Perceuse Sans Fil 18V', quantity: 1, unitPrice: 107.50, totalPrice: 107.50, vatRate: 20 },
      { id: 'li-2', description: 'Boite Chevilles Mix 200pcs', quantity: 1, unitPrice: 13.33, totalPrice: 13.33, vatRate: 20 },
      { id: 'li-3', description: 'Mètre Ruban 5m Magnet', quantity: 2, unitPrice: 16.67, totalPrice: 33.34, vatRate: 20 }
    ]
  },
  {
    id: 'rcpt-102',
    merchantName: 'Le Bistrot Parisien',
    merchantAddress: '12 Boulevard Saint-Germain, 75005 Paris',
    merchantVatNumber: 'FR 82 918273645',
    date: '2025-02-12',
    category: 'Restaurant',
    invoiceNumber: 'FAC-89421',
    currency: 'EUR',
    subtotal: 78.18,
    vatRate: 10,
    vatAmount: 7.82,
    totalTTC: 86.00,
    paymentMethod: 'Corporate Mastercard **** 8821',
    confidenceScore: 99,
    status: 'verified',
    syncedToSheets: true,
    syncedToNotion: false,
    uploadedAt: '2025-02-12 21:05',
    imageUrl: generateReceiptSvgUrl(
      'Le Bistrot Parisien',
      '2025-02-12',
      [
        { desc: '2x Formule Déjeuner', price: '56.00' },
        { desc: '1x Bouteille San Pellegrino', price: '7.00' },
        { desc: '2x Café Espresso', price: '23.00' }
      ],
      '86.00',
      '7.82'
    ),
    lineItems: [
      { id: 'li-4', description: 'Formule Déjeuner Client', quantity: 2, unitPrice: 25.45, totalPrice: 50.91, vatRate: 10 },
      { id: 'li-5', description: 'Bouteille San Pellegrino', quantity: 1, unitPrice: 6.36, totalPrice: 6.36, vatRate: 10 },
      { id: 'li-6', description: 'Café Espresso', quantity: 2, unitPrice: 10.45, totalPrice: 20.91, vatRate: 10 }
    ]
  },
  {
    id: 'rcpt-103',
    merchantName: 'TotalEnergies Relais',
    merchantAddress: 'A6 Km 42 Direction Lyon',
    merchantVatNumber: 'FR 19 302918273',
    date: '2025-02-10',
    category: 'Fuel',
    invoiceNumber: 'TOTAL-90812',
    currency: 'EUR',
    subtotal: 62.50,
    vatRate: 20,
    vatAmount: 12.50,
    totalTTC: 75.00,
    paymentMethod: 'Total Fleet Card **** 1029',
    confidenceScore: 96,
    status: 'verified',
    syncedToSheets: true,
    syncedToNotion: true,
    uploadedAt: '2025-02-10 08:14',
    imageUrl: generateReceiptSvgUrl(
      'TotalEnergies Relais',
      '2025-02-10',
      [
        { desc: 'Carburant Excellium Diesel 42.1L', price: '75.00' }
      ],
      '75.00',
      '12.50'
    ),
    lineItems: [
      { id: 'li-7', description: 'Carburant Excellium Diesel', quantity: 42.1, unitPrice: 1.48, totalPrice: 62.50, vatRate: 20 }
    ]
  },
  {
    id: 'rcpt-104',
    merchantName: 'Uber France SAS',
    merchantAddress: '139 Rue de Bercy, 75012 Paris',
    merchantVatNumber: 'FR 40 821940129',
    date: '2025-02-08',
    category: 'Transport',
    invoiceNumber: 'UBER-FR-398201',
    currency: 'EUR',
    subtotal: 28.33,
    vatRate: 10,
    vatAmount: 2.83,
    totalTTC: 31.16,
    paymentMethod: 'Apple Pay **** 4912',
    confidenceScore: 97,
    status: 'verified',
    syncedToSheets: false,
    syncedToNotion: false,
    uploadedAt: '2025-02-08 18:45',
    imageUrl: generateReceiptSvgUrl(
      'Uber France SAS',
      '2025-02-08',
      [
        { desc: 'Course UberX Gare de Lyon -> CDG', price: '31.16' }
      ],
      '31.16',
      '2.83'
    ),
    lineItems: [
      { id: 'li-8', description: 'Course UberX Gare de Lyon -> CDG', quantity: 1, unitPrice: 28.33, totalPrice: 28.33, vatRate: 10 }
    ]
  },
  {
    id: 'rcpt-105',
    merchantName: 'Starbucks Coffee Opéra',
    merchantAddress: '26 Avenue de l\'Opéra, 75001 Paris',
    merchantVatNumber: 'FR 55 901827364',
    date: '2025-02-05',
    category: 'Restaurant',
    invoiceNumber: 'SBX-77120',
    currency: 'EUR',
    subtotal: 13.82,
    vatRate: 10,
    vatAmount: 1.38,
    totalTTC: 15.20,
    paymentMethod: 'Contactless Visa **** 4912',
    confidenceScore: 95,
    status: 'verified',
    syncedToSheets: true,
    syncedToNotion: true,
    uploadedAt: '2025-02-05 09:30',
    imageUrl: generateReceiptSvgUrl(
      'Starbucks Coffee Opéra',
      '2025-02-05',
      [
        { desc: '1x Oat Milk Latte Venti', price: '6.70' },
        { desc: '1x Muffin Myrtille', price: '4.50' },
        { desc: '1x Espresso Solo', price: '4.00' }
      ],
      '15.20',
      '1.38'
    ),
    lineItems: [
      { id: 'li-9', description: 'Oat Milk Latte Venti', quantity: 1, unitPrice: 6.09, totalPrice: 6.09, vatRate: 10 },
      { id: 'li-10', description: 'Muffin Myrtille', quantity: 1, unitPrice: 4.09, totalPrice: 4.09, vatRate: 10 },
      { id: 'li-11', description: 'Espresso Solo', quantity: 1, unitPrice: 3.64, totalPrice: 3.64, vatRate: 10 }
    ]
  }
];

export const PRESET_RECEIPTS: PresetReceipt[] = [
  {
    id: 'preset-1',
    title: 'Hardware & Tools (Leroy Merlin)',
    merchantName: 'Leroy Merlin Paris',
    amount: '185.00 €',
    category: 'Hardware',
    imageUrl: generateReceiptSvgUrl(
      'Leroy Merlin Paris',
      '2025-02-14',
      [
        { desc: 'Perceuse Sans Fil 18V', price: '129.00' },
        { desc: 'Boite Chevilles Mix 200pcs', price: '16.00' },
        { desc: 'Mètre Ruban 5m Magnet', price: '40.00' }
      ],
      '185.00',
      '30.83'
    ),
    sampleData: {
      merchantName: 'Leroy Merlin Paris',
      merchantAddress: '159 Rue de Charenton, 75012 Paris',
      merchantVatNumber: 'FR 38 384920194',
      date: '2025-02-14',
      category: 'Hardware',
      invoiceNumber: 'INV-2025-0841',
      subtotal: 154.17,
      vatRate: 20,
      vatAmount: 30.83,
      totalTTC: 185.00,
      paymentMethod: 'Corporate Visa **** 4912',
      confidenceScore: 98,
      lineItems: [
        { id: 'li-p1', description: 'Perceuse Sans Fil 18V', quantity: 1, unitPrice: 107.50, totalPrice: 107.50, vatRate: 20 },
        { id: 'li-p2', description: 'Boite Chevilles Mix 200pcs', quantity: 1, unitPrice: 13.33, totalPrice: 13.33, vatRate: 20 },
        { id: 'li-p3', description: 'Mètre Ruban 5m Magnet', quantity: 2, unitPrice: 16.67, totalPrice: 33.34, vatRate: 20 }
      ]
    }
  },
  {
    id: 'preset-2',
    title: 'Client Lunch (Le Bistrot)',
    merchantName: 'Le Bistrot Parisien',
    amount: '86.00 €',
    category: 'Restaurant',
    imageUrl: generateReceiptSvgUrl(
      'Le Bistrot Parisien',
      '2025-02-12',
      [
        { desc: '2x Formule Déjeuner', price: '56.00' },
        { desc: '1x Bouteille San Pellegrino', price: '7.00' },
        { desc: '2x Café Espresso', price: '23.00' }
      ],
      '86.00',
      '7.82'
    ),
    sampleData: {
      merchantName: 'Le Bistrot Parisien',
      merchantAddress: '12 Boulevard Saint-Germain, 75005 Paris',
      merchantVatNumber: 'FR 82 918273645',
      date: '2025-02-12',
      category: 'Restaurant',
      invoiceNumber: 'FAC-89421',
      subtotal: 78.18,
      vatRate: 10,
      vatAmount: 7.82,
      totalTTC: 86.00,
      paymentMethod: 'Corporate Mastercard **** 8821',
      confidenceScore: 99,
      lineItems: [
        { id: 'li-p4', description: 'Formule Déjeuner Client', quantity: 2, unitPrice: 25.45, totalPrice: 50.91, vatRate: 10 },
        { id: 'li-p5', description: 'Bouteille San Pellegrino', quantity: 1, unitPrice: 6.36, totalPrice: 6.36, vatRate: 10 },
        { id: 'li-p6', description: 'Café Espresso', quantity: 2, unitPrice: 10.45, totalPrice: 20.91, vatRate: 10 }
      ]
    }
  },
  {
    id: 'preset-3',
    title: 'Fleet Refuel (TotalEnergies)',
    merchantName: 'TotalEnergies Relais',
    amount: '75.00 €',
    category: 'Fuel',
    imageUrl: generateReceiptSvgUrl(
      'TotalEnergies Relais',
      '2025-02-10',
      [
        { desc: 'Carburant Excellium Diesel 42.1L', price: '75.00' }
      ],
      '75.00',
      '12.50'
    ),
    sampleData: {
      merchantName: 'TotalEnergies Relais',
      merchantAddress: 'A6 Km 42 Direction Lyon',
      merchantVatNumber: 'FR 19 302918273',
      date: '2025-02-10',
      category: 'Fuel',
      invoiceNumber: 'TOTAL-90812',
      subtotal: 62.50,
      vatRate: 20,
      vatAmount: 12.50,
      totalTTC: 75.00,
      paymentMethod: 'Total Fleet Card **** 1029',
      confidenceScore: 96,
      lineItems: [
        { id: 'li-p7', description: 'Carburant Excellium Diesel 42.1L', quantity: 42.1, unitPrice: 1.48, totalPrice: 62.50, vatRate: 20 }
      ]
    }
  }
];

export const INITIAL_WHATSAPP_MESSAGES: WhatsAppMessage[] = [
  {
    id: 'wa-1',
    sender: 'bot',
    timestamp: '10:14 AM',
    text: '👋 Bonjour! Welcome to DocuSnap AI Assistant. Send or snap any receipt/invoice photo here, and I will extract the merchant, VAT, line items, and sync it straight to your Google Sheet!'
  },
  {
    id: 'wa-2',
    sender: 'user',
    timestamp: '10:15 AM',
    text: 'Here is my hardware store receipt from this morning.'
  },
  {
    id: 'wa-3',
    sender: 'user',
    timestamp: '10:15 AM',
    imageUrl: PRESET_RECEIPTS[0].imageUrl
  },
  {
    id: 'wa-4',
    sender: 'bot',
    timestamp: '10:15 AM',
    text: '⚡ Instant Scan Complete (Confidence: 98%):\n\n• Merchant: Leroy Merlin Paris\n• Date: 2025-02-14\n• Total TTC: 185.00 €\n• Deductible VAT (20%): 30.83 €\n• Category: Hardware\n\n✅ Automatically synced row #18 to "Q1 2025 Expense Ledger" Google Sheet.',
    parsedReceipt: INITIAL_RECEIPTS[0]
  }
];

export const INITIAL_INTEGRATIONS_CONFIG: IntegrationConfig = {
  googleSheets: {
    enabled: true,
    spreadsheetName: 'DocuSnap_Q1_2025_Expenses.xlsx',
    sheetName: 'All Receipts',
    autoSync: true,
    lastSyncedAt: '2 mins ago',
    syncedRowsCount: 142
  },
  notion: {
    enabled: true,
    databaseName: 'Accounting & Expense Vault 2025',
    autoSync: true,
    lastSyncedAt: '15 mins ago'
  },
  stripe: {
    enabled: true,
    status: 'active',
    plan: 'DocuSnap Pro B2B (1,000 scans/mo)'
  },
  webhook: {
    enabled: true,
    url: 'https://api.acme-corp.com/v1/accounting/webhooks/docusnap',
    secret: 'whsec_98410f92842a198c',
    events: ['receipt.parsed', 'receipt.synced', 'vat.alert']
  }
};

export const INITIAL_WEBHOOK_LOGS: WebhookLog[] = [
  {
    id: 'wh-log-1',
    timestamp: '2025-02-14 15:20:04',
    event: 'receipt.parsed',
    url: 'https://api.acme-corp.com/v1/accounting/webhooks/docusnap',
    status: 200,
    response: '{"success":true,"item_id":"rcpt-101"}'
  },
  {
    id: 'wh-log-2',
    timestamp: '2025-02-12 21:05:12',
    event: 'receipt.synced',
    url: 'https://api.acme-corp.com/v1/accounting/webhooks/docusnap',
    status: 200,
    response: '{"success":true,"row_id":141}'
  }
];
