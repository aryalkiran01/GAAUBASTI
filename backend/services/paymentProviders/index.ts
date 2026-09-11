import { PaymentProvider, SupportedProvider } from './types';
import { StripeProvider } from './StripeProvider';
import { EsewaProvider } from './EsewaProvider';
import { KhaltiProvider } from './KhaltiProvider';

export * from './types';
export * from './StripeProvider';
export * from './EsewaProvider';
export * from './KhaltiProvider';

const providers: Record<SupportedProvider, PaymentProvider> = {
  stripe: new StripeProvider(),
  esewa: new EsewaProvider(),
  khalti: new KhaltiProvider()
};

/**
 * Returns the requested payment provider adapter.
 */
export function getPaymentProvider(providerName?: string): PaymentProvider {
  const normalized = (providerName || 'stripe').toLowerCase().trim() as SupportedProvider;
  const provider = providers[normalized];

  if (!provider) {
    throw new Error(
      `Unsupported payment provider: "${providerName}". Supported providers are: ${Object.keys(providers).join(', ')}.`
    );
  }

  return provider;
}

/**
 * Validates whether a provider name is currently supported.
 */
export function isSupportedProvider(providerName: string): providerName is SupportedProvider {
  return ['stripe', 'esewa', 'khalti'].includes(providerName.toLowerCase().trim());
}

/**
 * Default USD to NPR exchange rate if live conversion is not configured.
 */
export const DEFAULT_USD_TO_NPR_RATE = 135;

/**
 * Converts USD booking total to NPR server-authoritatively.
 */
export function convertToNpr(usdAmount: number, customRate?: number): number {
  const rate = customRate && customRate > 0 ? customRate : DEFAULT_USD_TO_NPR_RATE;
  return Math.round(usdAmount * rate);
}
