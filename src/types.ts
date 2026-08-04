export type TabType = 'dashboard' | 'scanner' | 'whatsapp' | 'integrations' | 'pricing' | 'settings';

export type PlanType = 'free' | 'pro';

export interface PlanConfig {
  type: PlanType;
  label: string;
  price: number; // €/mois
  scansPerMonth: number; // -1 = ∞
  maxReceipts: number;   // -1 = ∞
  geminiAI: boolean;
  whatsappBot: boolean;
  webhooks: boolean;
  googleSheetsSync: boolean;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    type: 'free',
    label: 'Free',
    price: 0,
    scansPerMonth: 10,
    maxReceipts: 50,
    geminiAI: false,
    whatsappBot: false,
    webhooks: false,
    googleSheetsSync: false,
  },
  pro: {
    type: 'pro',
    label: 'Pro',
    price: 29,
    scansPerMonth: -1,
    maxReceipts: -1,
    geminiAI: true,
    whatsappBot: true,
    webhooks: true,
    googleSheetsSync: true,
  },
};

export type CategoryType = 'Hardware' | 'Restaurant' | 'Fuel' | 'Transport' | 'Office' | 'Software' | 'Travel' | 'Services';

export type InvoiceStatus = 'verified' | 'pending' | 'flagged' | 'draft';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vatRate: number; // percentage e.g. 20
}

export interface ReceiptData {
  id: string;
  merchantName: string;
  merchantAddress?: string;
  merchantVatNumber?: string;
  date: string;
  category: CategoryType;
  invoiceNumber?: string;
  currency: string;
  subtotal: number;
  vatRate: number; // primary VAT rate percentage (e.g., 20 or 10 or 5.5)
  vatAmount: number;
  totalTTC: number;
  paymentMethod: string;
  confidenceScore: number; // 0 to 100
  status: InvoiceStatus;
  lineItems: LineItem[];
  imageUrl: string;
  uploadedAt: string;
  syncedToSheets?: boolean;
  syncedToNotion?: boolean;
  notes?: string;
}

export interface PresetReceipt {
  id: string;
  title: string;
  merchantName: string;
  amount: string;
  category: CategoryType;
  imageUrl: string;
  sampleData: Partial<ReceiptData>;
}

export interface WhatsAppMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text?: string;
  imageUrl?: string;
  parsedReceipt?: ReceiptData;
  isProcessing?: boolean;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  url: string;
  status: number;
  response: string;
}

export interface IntegrationConfig {
  googleSheets: {
    enabled: boolean;
    spreadsheetName: string;
    sheetName: string;
    autoSync: boolean;
    lastSyncedAt?: string;
    syncedRowsCount: number;
  };
  notion: {
    enabled: boolean;
    databaseName: string;
    autoSync: boolean;
    lastSyncedAt?: string;
  };
  stripe: {
    enabled: boolean;
    status: 'active' | 'inactive';
    plan: string;
  };
  webhook: {
    enabled: boolean;
    url: string;
    secret: string;
    events: string[];
  };
}
