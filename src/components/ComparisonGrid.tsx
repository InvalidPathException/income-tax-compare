'use client';

import { SelectedRegion, Currency } from '@/types';
import { calculateTax } from '@/lib/calculateTax';
import TaxBreakdown from './TaxBreakdown';

interface ComparisonGridProps {
  selectedRegions: SelectedRegion[];
  income: number;
  displayCurrency: Currency;
  inputCurrency: Currency;
  exchangeRate: number;
}

export default function ComparisonGrid({
  selectedRegions,
  income,
  displayCurrency,
  inputCurrency,
  exchangeRate
}: ComparisonGridProps) {
  if (selectedRegions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">No regions selected</p>
      </div>
    );
  }

  if (income === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">Enter an income amount above</p>
      </div>
    );
  }

  const calculations = selectedRegions.map(region => ({
    region,
    calculation: calculateTax(income, region.code)
  }));

  // Sort by take-home income (descending)
  calculations.sort((a, b) => b.calculation.afterTaxIncome - a.calculation.afterTaxIncome);

  return (
    <div className="w-full">
      <h3 className="text-xs font-medium text-gray-600 text-center mb-6 uppercase tracking-wider">
        Tax Breakdown
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {calculations.map(({ region, calculation }, index) => (
          <div key={`${region.country}-${region.code}`} className="relative">
            {index === 0 && calculations.length > 1 && (
              <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                Lowest Tax
              </div>
            )}
            <TaxBreakdown
              region={region}
              calculation={calculation}
              income={income}
              displayCurrency={displayCurrency}
              inputCurrency={inputCurrency}
              exchangeRate={exchangeRate}
            />
          </div>
        ))}
      </div>
    </div>
  );
}