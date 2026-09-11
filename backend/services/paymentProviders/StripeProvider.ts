import {
  PaymentProvider,
  PaymentInitializationResult,
  PaymentVerificationResult,
  RefundResult,
  WebhookResult,
  SupportedProvider
} from './types';

export class StripeProvider implements PaymentProvider {
  name: SupportedProvider = 'stripe';

  private getStripeClient() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is missing in server environment.');
    }
    return require('stripe')(key);
  }

  async initializePayment(params: {
    payment: any;
    booking: any;
    user: any;
    amount: number;
    currency: string;
  }): Promise<PaymentInitializationResult> {
    const { payment, booking, user, amount, currency } = params;
    const stripe = this.getStripeClient();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: String(currency || 'USD').toLowerCase(),
      metadata: {
        bookingId: booking._id.toString(),
        listingId: booking.listing?._id ? booking.listing._id.toString() : String(booking.listing),
        userId: user._id.toString(),
        paymentId: payment._id.toString()
      },
      automatic_payment_methods: { enabled: true }
    });

    return {
      paymentId: payment._id.toString(),
      provider: 'stripe',
      status: 'processing',
      amount,
      currency: String(currency || 'USD').toUpperCase(),
      providerPaymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      priceBreakdown: booking.priceBreakdown
    };
  }

  async verifyPayment(params: {
    payment: any;
    providerPaymentId?: string;
    amount?: number;
  }): Promise<PaymentVerificationResult> {
    const { payment, providerPaymentId, amount } = params;
    const stripe = this.getStripeClient();

    const intentId = providerPaymentId || payment.providerPaymentId;
    if (!intentId) {
      return {
        success: false,
        paymentId: payment._id.toString(),
        bookingId: payment.booking?._id?.toString() || payment.booking?.toString(),
        status: 'failed',
        amount: payment.amount,
        currency: payment.currency,
        providerPaymentId: '',
        error: 'No Stripe PaymentIntent ID provided for verification'
      };
    }

    const intent = await stripe.paymentIntents.retrieve(intentId);
    const expectedAmountCents = Math.round(Number(amount ?? payment.amount) * 100);
    const amountMatches = Number(intent.amount) === expectedAmountCents;

    if (intent.status === 'succeeded' && amountMatches) {
      return {
        success: true,
        paymentId: payment._id.toString(),
        bookingId: payment.booking?._id?.toString() || payment.booking?.toString(),
        status: 'paid',
        amount: intent.amount / 100,
        currency: intent.currency.toUpperCase(),
        providerPaymentId: intent.id,
        rawResponse: intent
      };
    }

    return {
      success: false,
      paymentId: payment._id.toString(),
      bookingId: payment.booking?._id?.toString() || payment.booking?.toString(),
      status: intent.status === 'requires_payment_method' || intent.status === 'canceled' ? 'failed' : 'pending',
      amount: intent.amount / 100,
      currency: intent.currency.toUpperCase(),
      providerPaymentId: intent.id,
      error: `Payment verification failed with Stripe intent status: ${intent.status}`,
      rawResponse: intent
    };
  }

  async processRefund(params: {
    payment: any;
    amount: number;
    reason?: string;
    idempotencyKey?: string;
  }): Promise<RefundResult> {
    const { payment, amount, reason, idempotencyKey } = params;
    const stripe = this.getStripeClient();

    const refund = await stripe.refunds.create(
      {
        payment_intent: payment.providerPaymentId,
        amount: Math.round(Number(amount) * 100),
        metadata: {
          paymentId: payment._id.toString(),
          bookingId: payment.booking?._id?.toString() || String(payment.booking || ''),
          reason: reason || 'cancellation'
        }
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    return {
      success: refund.status === 'succeeded' || refund.status === 'pending',
      refundId: refund.id,
      amount: refund.amount / 100,
      status: amount >= payment.amount ? 'refunded' : 'partially_refunded',
      rawResponse: refund
    };
  }

  async handleWebhook(params: {
    headers: Record<string, any>;
    rawBody: any;
    body: Record<string, any>;
  }): Promise<WebhookResult> {
    const { headers, rawBody } = params;
    const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is missing in server environment.');
    }

    const signature = headers['stripe-signature'];
    if (!signature) {
      return { handled: false, error: 'Missing Stripe signature header' };
    }

    const stripe = this.getStripeClient();
    const event = stripe.webhooks.constructEvent(rawBody, signature, stripeSecret);

    const eventObject = event.data?.object;
    if (!eventObject) {
      return { handled: false, error: 'Invalid Stripe webhook event object' };
    }

    const paymentIntentId = eventObject.payment_intent || eventObject.id;

    if (event.type === 'payment_intent.succeeded') {
      return {
        handled: true,
        eventId: event.id,
        eventType: event.type,
        providerPaymentId: paymentIntentId,
        status: 'paid',
        amount: eventObject.amount ? eventObject.amount / 100 : undefined,
        currency: eventObject.currency ? eventObject.currency.toUpperCase() : undefined
      };
    }

    if (event.type === 'payment_intent.payment_failed') {
      return {
        handled: true,
        eventId: event.id,
        eventType: event.type,
        providerPaymentId: paymentIntentId,
        status: 'failed'
      };
    }

    if (event.type === 'charge.refunded') {
      return {
        handled: true,
        eventId: event.id,
        eventType: event.type,
        providerPaymentId: paymentIntentId,
        status: 'refunded',
        amount: eventObject.amount_refunded ? eventObject.amount_refunded / 100 : undefined
      };
    }

    return {
      handled: true,
      eventId: event.id,
      eventType: event.type,
      providerPaymentId: paymentIntentId
    };
  }
}
