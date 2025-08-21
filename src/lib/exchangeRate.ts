import { ExchangeRateResponse } from '@/types';

let cachedRate: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getExchangeRate(): Promise<number> {
  const now = Date.now();
  
  // Return cached rate if still valid
  if (cachedRate && (now - cacheTimestamp < CACHE_DURATION)) {
    return cachedRate;
  }
  
  try {
    const response = await fetch(
      'https://bcd-api-dca-ipa.cbsa-asfc.cloud-nuage.canada.ca/exchange-rate-lambda/exchange-rates'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }
    
    const data: ExchangeRateResponse = await response.json();
    
    // Find USD to CAD rate
    const usdToCad = data.ForeignExchangeRates.find(
      rate => rate.FromCurrency.Value === 'USD' && rate.ToCurrency.Value === 'CAD'
    );
    
    if (usdToCad) {
      cachedRate = parseFloat(usdToCad.Rate);
      cacheTimestamp = now;
      return cachedRate;
    }
    
    // Fallback rate if not found
    return 1.35;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Return fallback rate on error
    return cachedRate || 1.35;
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: 'CAD' | 'USD',
  toCurrency: 'CAD' | 'USD',
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  if (fromCurrency === 'USD' && toCurrency === 'CAD') {
    return amount * exchangeRate;
  }
  
  if (fromCurrency === 'CAD' && toCurrency === 'USD') {
    return amount / exchangeRate;
  }
  
  return amount;
}