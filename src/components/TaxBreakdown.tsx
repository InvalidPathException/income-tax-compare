'use client';

import { TaxCalculation, Currency, SelectedRegion } from '@/types';
import { convertCurrency } from '@/lib/exchangeRate';

interface TaxBreakdownProps {
  region: SelectedRegion;
  calculation: TaxCalculation;
  income: number;
  displayCurrency: Currency;
  inputCurrency: Currency;
  exchangeRate: number;
}

export default function TaxBreakdown({
  region,
  calculation,
  income,
  displayCurrency,
  inputCurrency,
  exchangeRate
}: TaxBreakdownProps) {
  const regionCurrency = region.country === 'CA' ? 'CAD' : 'USD';
  
  const formatCurrency = (amount: number) => {
    const converted = convertCurrency(amount, regionCurrency as 'CAD' | 'USD', displayCurrency, exchangeRate);
    const symbol = displayCurrency === 'CAD' ? 'C$' : '$';
    return `${symbol}${converted.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}`;
  };

  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const takeHomePercent = income > 0 ? (calculation.afterTaxIncome / income) * 100 : 0;

  return (
    <div className="bg-white rounded-md border border-gray-200 p-3 hover:border-gray-300 transition-colors">
      <div className="mb-2">
        <h3 className="font-medium text-gray-900 text-sm">{region.name}</h3>
        <p className="text-xs text-gray-500">{region.country === 'CA' ? 'Canada' : 'United States'}</p>
      </div>
      
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Federal</span>
          <span>{formatCurrency(calculation.federalTax)}</span>
        </div>
        
        <div className="flex justify-between text-gray-600">
          <span>{region.country === 'CA' ? 'Provincial' : 'State'}</span>
          <span>{formatCurrency(calculation.regionalTax)}</span>
        </div>
        
        <div className="pt-1.5 border-t">
          <div className="flex justify-between text-gray-900 font-medium">
            <span>Total Tax</span>
            <span>{formatCurrency(calculation.totalTax)}</span>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>Effective Rate</span>
            <span>{formatPercent(calculation.effectiveRate)}</span>
          </div>
        </div>
        
        <div className="pt-1.5 border-t">
          <div className="flex justify-between items-baseline">
            <span className="text-gray-600">Take Home</span>
            <div className="text-right">
              <div className="font-semibold text-gray-900 text-xs">
                {formatCurrency(calculation.afterTaxIncome)}
              </div>
              <div className="text-xs text-gray-500">
                {takeHomePercent.toFixed(1)}% of gross
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}