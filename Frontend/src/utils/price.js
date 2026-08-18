// Shared customer-facing price helpers (India).
// All customer prices are displayed inclusive of 13% VAT.

export const VAT_RATE = 0.13;
export const VAT_LABEL = 'VAT Included';

export const DELIVERY_FREE_THRESHOLD = 2000;
export const DELIVERY_FEE = 150;

// Round to 2 decimal places (avoids floating point drift).
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Return a price with 13% VAT already added on top of the base price.
export const withVat = (amount) => round2(Number(amount || 0) * (1 + VAT_RATE));

// Format an amount as Indian Rupees.
export const formatINR = (amount, { decimals = true } = {}) =>
    '₹' +
    Number(amount || 0).toLocaleString('en-IN', decimals
        ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        : { maximumFractionDigits: 0 });

// Delivery is FREE above the threshold, otherwise a flat fee applies.
export const deliveryFee = (subtotal) =>
    Number(subtotal || 0) >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_FEE;