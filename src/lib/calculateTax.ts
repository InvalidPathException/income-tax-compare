import { TaxBracket, TaxCalculation } from '@/types';
import taxRates from '@/data/taxRates.json';

export function getBracketDetails(
  income: number, 
  brackets: TaxBracket[], 
  nativeCurrency: string
): string[] {
  const details: string[] = [];
  
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    
    const taxableInThisBracket = bracket.max 
      ? Math.min(income, bracket.max) - bracket.min
      : income - bracket.min;
    
    if (taxableInThisBracket > 0) {
      const tax = taxableInThisBracket * bracket.rate;
      const rate = (bracket.rate * 100).toFixed(1);
      
      const rangeStr = bracket.max 
        ? `${nativeCurrency}${bracket.min.toLocaleString()}-${nativeCurrency}${bracket.max.toLocaleString()}`
        : `${nativeCurrency}${bracket.min.toLocaleString()}+`;
      
      details.push(`${rate}% on ${rangeStr}: ${nativeCurrency}${Math.round(tax).toLocaleString()}`);
    }
  }
  
  return details;
}

export function calculateProgressiveTax(income: number, brackets: TaxBracket[]): number {
  let tax = 0;
  
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    
    const taxableInThisBracket = bracket.max 
      ? Math.min(income, bracket.max) - bracket.min
      : income - bracket.min;
    
    tax += taxableInThisBracket * bracket.rate;
  }
  
  return tax;
}

export function calculateTax(grossIncome: number, regionCode: string): TaxCalculation {
  const region = taxRates.regions[regionCode as keyof typeof taxRates.regions];
  if (!region) {
    throw new Error(`Region ${regionCode} not found`);
  }
  
  const stateDeduction = 'standardDeduction' in region ? (region as { standardDeduction: number }).standardDeduction : 0;
  const taxCredit = 'taxCredit' in region ? (region as { taxCredit: number }).taxCredit : 0;
  
  let federalTax = 0;
  let federalTaxableIncome = grossIncome;
  const stateTaxableIncome = Math.max(0, grossIncome - stateDeduction);
  
  if (region.country === 'CA') {
    federalTax = calculateProgressiveTax(grossIncome, taxRates.federalTax.CA);
  } else {
    federalTaxableIncome = Math.max(0, grossIncome - taxRates.federalTax.US.standardDeduction);
    federalTax = calculateProgressiveTax(federalTaxableIncome, taxRates.federalTax.US.brackets);
  }
  
  let regionalTax = calculateProgressiveTax(stateTaxableIncome, region.brackets);
  regionalTax = Math.max(0, regionalTax - taxCredit);
  
  const totalTax = federalTax + regionalTax;
  const afterTaxIncome = grossIncome - totalTax;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) : 0;
  
  return {
    federalTax,
    regionalTax,
    totalTax,
    effectiveRate,
    afterTaxIncome
  };
}

export function calculateTotalTax(grossIncome: number, country: 'CA' | 'US', regionCode: string, inputCurrency?: string, displayCurrency?: string, exchangeRate?: number) {
  const result = calculateTax(grossIncome, regionCode);
  const region = taxRates.regions[regionCode as keyof typeof taxRates.regions];
  
  const federalDeduction = country === 'US' ? taxRates.federalTax.US.standardDeduction : 0;
  const stateDeduction = 'standardDeduction' in region ? (region as { standardDeduction: number }).standardDeduction : 0;
  const taxCredit = 'taxCredit' in region ? (region as { taxCredit: number }).taxCredit : 0;
  
  const federalTaxableIncome = Math.max(0, grossIncome - federalDeduction);
  const stateTaxableIncome = Math.max(0, grossIncome - stateDeduction);
  
  const nativeCurrency = country === 'CA' ? 'CA$' : 'US$';
  const userCurrency = inputCurrency === 'CAD' ? 'CA$' : 'US$';
  
  const federalBrackets = country === 'CA' ? taxRates.federalTax.CA : taxRates.federalTax.US.brackets;
  const federalBracketDetails = getBracketDetails(
    country === 'CA' ? grossIncome : federalTaxableIncome, 
    federalBrackets,
    nativeCurrency
  );
  const regionalBracketDetails = getBracketDetails(
    stateTaxableIncome, 
    region.brackets, 
    nativeCurrency
  );
  
  // Convert tax amounts to user currency if different
  let federalTaxDisplay = result.federalTax;
  let regionalTaxDisplay = result.regionalTax;
  let totalTaxDisplay = result.totalTax;
  
  const needsConversion = (inputCurrency === 'CAD' && country === 'US') || (inputCurrency === 'USD' && country === 'CA');
  if (exchangeRate && needsConversion) {
    const conversionRate = country === 'US' ? exchangeRate : 1 / exchangeRate;
    federalTaxDisplay = result.federalTax * conversionRate;
    regionalTaxDisplay = result.regionalTax * conversionRate;
    totalTaxDisplay = result.totalTax * conversionRate;
  }
  
  return {
    totalTax: result.totalTax,
    effectiveRate: result.effectiveRate * 100,
    federalTax: result.federalTax,
    regionalTax: result.regionalTax,
    federalTaxDisplay,
    regionalTaxDisplay,
    totalTaxDisplay,
    federalDeduction,
    stateDeduction,
    taxCredit,
    federalBracketDetails,
    regionalBracketDetails,
    nativeCurrency,
    userCurrency,
    needsConversion
  };
}