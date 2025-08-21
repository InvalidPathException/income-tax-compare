import { TaxBracket, TaxCalculation } from '@/types';
import taxRates from '@/data/taxRates.json';

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
  
  let federalTax = 0;
  let federalTaxableIncome = grossIncome;
  let stateTaxableIncome = grossIncome;
  
  if (region.country === 'CA') {
    // Canadian federal tax (no standard deduction concept)
    federalTax = calculateProgressiveTax(grossIncome, taxRates.federalTax.CA);
  } else {
    // US federal tax - apply federal standard deduction
    federalTaxableIncome = Math.max(0, grossIncome - taxRates.federalTax.US.standardDeduction);
    federalTax = calculateProgressiveTax(federalTaxableIncome, taxRates.federalTax.US.brackets);
    
    // Apply state standard deduction if applicable
    const stateDeduction = 'standardDeduction' in region ? (region as { standardDeduction: number }).standardDeduction : 0;
    stateTaxableIncome = Math.max(0, grossIncome - stateDeduction);
  }
  
  // Calculate regional (state/provincial) tax
  let regionalTax = region.country === 'CA' 
    ? calculateProgressiveTax(grossIncome, region.brackets)  // Canadian provinces don't use standard deductions
    : calculateProgressiveTax(stateTaxableIncome, region.brackets);  // US states use their standard deduction
  
  // Handle Utah's special case - it has a $900 tax credit instead of standard deduction
  if (regionCode === 'UT' && region.country === 'US') {
    regionalTax = Math.max(0, calculateProgressiveTax(grossIncome, region.brackets) - 900);
  }
  
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

export function calculateTotalTax(grossIncome: number, country: 'CA' | 'US', regionCode: string) {
  const result = calculateTax(grossIncome, regionCode);
  return {
    totalTax: result.totalTax,
    effectiveRate: result.effectiveRate * 100 // Convert to percentage
  };
}