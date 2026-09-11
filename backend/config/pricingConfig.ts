export {};

export interface PricingBreakdown {
  nights: number;
  basePrice: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  totalPrice: number;
}

const getPricingConfig = () => {
  const cleaningFee = Number(process.env.PRICING_CLEANING_FEE) || 25;
  const serviceFeeRate = Number(process.env.PRICING_SERVICE_FEE_RATE) || 0.10;
  const taxRate = Number(process.env.PRICING_TAX_RATE) || 0.05;

  return {
    cleaningFee,
    serviceFeeRate,
    taxRate
  };
};

const calculateBookingPrice = (
  listingPrice: number,
  startDate: string | Date,
  endDate: string | Date
): PricingBreakdown => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  
  const { cleaningFee, serviceFeeRate, taxRate } = getPricingConfig();
  
  const basePrice = Math.round(listingPrice * nights);
  const serviceFee = Math.round(basePrice * serviceFeeRate);
  const taxes = Math.round(basePrice * taxRate);
  const totalPrice = basePrice + cleaningFee + serviceFee + taxes;

  return {
    nights,
    basePrice,
    cleaningFee,
    serviceFee,
    taxes,
    totalPrice
  };
};

const pricingModule = {
  getPricingConfig,
  calculateBookingPrice
};

module.exports = pricingModule;
module.exports.default = pricingModule;
module.exports.getPricingConfig = getPricingConfig;
module.exports.calculateBookingPrice = calculateBookingPrice;

export { getPricingConfig, calculateBookingPrice };
