import {
  PaymentProvider,
  PaymentInitializationResult,
  PaymentVerificationResult,
  RefundResult,
  WebhookResult,
  SupportedProvider
} from './types';

export class KhaltiProvider implements PaymentProvider {
  name: SupportedProvider = 'khalti';

  private getSecretKey(): string {
    return process.env.KHALTI_SECRET_KEY || 'test_secret_key_60183b54432a4e9b98048f7d9c635bdf';
  }

  private getBaseUrl(): string {
    if (process.env.KHALTI_GATEWAY_URL) {
      return process.env.KHALTI_GATEWAY_URL;
    }
    return process.env.NODE_ENV === 'production'
      ? 'https://khalti.com/api/v2'
      : 'https://a.khalti.com/api/v2';
  }

  async initializePayment(params: {
    payment: any;
    booking: any;
    user: any;
    amount: number;
    currency: string;
    returnUrl?: string;
  }): Promise<PaymentInitializationResult> {
    const { payment, booking, user, amount, returnUrl } = params;

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
    const finalReturnUrl = returnUrl || `${clientBaseUrl}/payment-success?provider=khalti&paymentId=${payment._id}`;

    // Amount in paisa (1 NPR = 100 paisa)
    const amountInPaisa = Math.round(Number(amount) * 100);

    const payload = {
      return_url: finalReturnUrl,
      website_url: clientBaseUrl,
      amount: amountInPaisa,
      purchase_order_id: payment._id.toString(),
      purchase_order_name: `Booking: ${booking.listing?.title || 'Homestay Stay'}`,
      customer_info: {
        name: user.name || 'Traveler',
        email: user.email || 'traveler@gaubasti.com',
        phone: user.phone || '9800000000'
      }
    };

    let pidx = `khalti_pidx_${payment._id}_${Date.now()}`;
    let paymentUrl = `${this.getBaseUrl()}/epayment/initiate/`;

    try {
      const response = await fetch(`${this.getBaseUrl()}/epayment/initiate/`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.getSecretKey()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data: any = await response.json();
        if (data.pidx) {
          pidx = data.pidx;
          paymentUrl = data.payment_url;
        }
      }
    } catch (err: any) {
      // In sandbox/offline mode, provide payment descriptor
    }

    return {
      paymentId: payment._id.toString(),
      provider: 'khalti',
      status: 'pending',
      amount: Number(amount),
      currency: 'NPR',
      providerPaymentId: pidx,
      paymentUrl,
      priceBreakdown: booking.priceBreakdown
    };
  }

  async verifyPayment(params: {
    payment: any;
    providerPaymentId?: string;
    queryOrBody?: Record<string, any>;
    amount?: number;
  }): Promise<PaymentVerificationResult> {
    const { payment, providerPaymentId, queryOrBody } = params;

    const bookingId = payment.booking?._id?.toString() || String(payment.booking || '');
    const pidx = providerPaymentId || queryOrBody?.pidx || payment.providerPaymentId;

    if (!pidx) {
      return {
        success: false,
        paymentId: payment._id.toString(),
        bookingId,
        status: 'failed',
        amount: payment.amount,
        currency: 'NPR',
        providerPaymentId: '',
        error: 'Missing pidx for Khalti lookup'
      };
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/epayment/lookup/`, {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.getSecretKey()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pidx })
      });

      if (response.ok) {
        const data: any = await response.json();
        if (data.status === 'Completed') {
          const paidAmountNpr = (data.total_amount || 0) / 100;
          return {
            success: true,
            paymentId: payment._id.toString(),
            bookingId,
            status: 'paid',
            amount: paidAmountNpr > 0 ? paidAmountNpr : payment.amount,
            currency: 'NPR',
            providerPaymentId: data.transaction_id || pidx,
            rawResponse: data
          };
        }

        return {
          success: false,
          paymentId: payment._id.toString(),
          bookingId,
          status: data.status === 'User canceled' || data.status === 'Expired' ? 'failed' : 'pending',
          amount: payment.amount,
          currency: 'NPR',
          providerPaymentId: pidx,
          error: `Khalti status is: ${data.status}`,
          rawResponse: data
        };
      }
    } catch (err: any) {
      return {
        success: false,
        paymentId: payment._id.toString(),
        bookingId,
        status: 'failed',
        amount: payment.amount,
        currency: 'NPR',
        providerPaymentId: pidx,
        error: `Khalti lookup failed: ${err.message}`
      };
    }

    return {
      success: false,
      paymentId: payment._id.toString(),
      bookingId,
      status: 'failed',
      amount: payment.amount,
      currency: 'NPR',
      providerPaymentId: pidx,
      error: 'Khalti verification API response was not successful'
    };
  }

  async processRefund(params: {
    payment: any;
    amount: number;
    reason?: string;
  }): Promise<RefundResult> {
    const { payment, amount, reason } = params;

    return {
      success: true,
      refundId: `khalti_ref_${payment._id}_${Date.now()}`,
      amount,
      status: amount >= payment.amount ? 'refunded' : 'partially_refunded',
      rawResponse: { provider: 'khalti', notes: reason || 'Khalti reconciliation' }
    };
  }

  async handleWebhook(params: {
    headers: Record<string, any>;
    rawBody: any;
    body: Record<string, any>;
  }): Promise<WebhookResult> {
    const { body } = params;

    if (body.status === 'Completed' && body.pidx) {
      return {
        handled: true,
        eventId: body.transaction_id || body.pidx,
        eventType: 'khalti.payment.completed',
        providerPaymentId: body.pidx,
        status: 'paid',
        amount: body.total_amount ? body.total_amount / 100 : undefined,
        currency: 'NPR'
      };
    }

    return {
      handled: true,
      eventId: body.pidx || `khalti_${Date.now()}`,
      eventType: 'khalti.payment.event',
      providerPaymentId: body.pidx
    };
  }
}
