export type SupportedProvider = 'stripe' | 'esewa' | 'khalti';

export interface PaymentInitializationResult {
  paymentId: string;
  provider: SupportedProvider;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  amount: number;
  currency: string;
  providerPaymentId?: string;
  clientSecret?: string; // For Stripe Elements
  paymentUrl?: string;   // For eSewa / Khalti redirect or SDK init
  formData?: Record<string, string | number>; // For form POST (e.g. eSewa v2)
  priceBreakdown?: Record<string, any>;
  expiresAt?: Date;
}

export interface PaymentVerificationResult {
  success: boolean;
  paymentId: string;
  bookingId: string;
  status: 'paid' | 'failed' | 'pending';
  amount: number;
  currency: string;
  providerPaymentId: string;
  rawResponse?: any;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: 'refunded' | 'partially_refunded' | 'failed';
  rawResponse?: any;
  error?: string;
}

export interface WebhookResult {
  handled: boolean;
  duplicate?: boolean;
  eventId?: string;
  eventType?: string;
  paymentId?: string;
  providerPaymentId?: string;
  status?: 'paid' | 'failed' | 'refunded';
  amount?: number;
  currency?: string;
  error?: string;
}

export interface PaymentProvider {
  name: SupportedProvider;
  
  /**
   * Initializes a payment with the provider
   */
  initializePayment(params: {
    payment: any;
    booking: any;
    user: any;
    amount: number;
    currency: string;
    returnUrl?: string;
    callbackUrl?: string;
  }): Promise<PaymentInitializationResult>;

  /**
   * Verifies the payment transaction status with the provider
   */
  verifyPayment(params: {
    payment: any;
    providerPaymentId?: string;
    queryOrBody?: Record<string, any>;
    amount?: number;
  }): Promise<PaymentVerificationResult>;

  /**
   * Processes a refund
   */
  processRefund(params: {
    payment: any;
    amount: number;
    reason?: string;
    idempotencyKey?: string;
  }): Promise<RefundResult>;

  /**
   * Validates and processes provider webhook payloads
   */
  handleWebhook(params: {
    headers: Record<string, any>;
    rawBody: any;
    body: Record<string, any>;
  }): Promise<WebhookResult>;
}
