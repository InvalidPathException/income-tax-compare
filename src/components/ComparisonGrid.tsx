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

  const calculations = selectedRegions.map(region => {
    const regionCurrency = region.country === 'CA' ? 'CAD' : 'USD';
    const baseIncome = inputCurrency === regionCurrency ? income : 
                       inputCurrency === 'USD' ? income * exchangeRate : 
                       income / exchangeRate;
    return {
      region,
      calculation: calculateTax(baseIncome, region.code),
      baseIncome
    };
  });

  // Sort by take-home income (descending) - convert to common currency for comparison
  calculations.sort((a, b) => {
    // Convert both to input currency for fair comparison
    const aRegionCurrency = a.region.country === 'CA' ? 'CAD' : 'USD';
    const bRegionCurrency = b.region.country === 'CA' ? 'CAD' : 'USD';
    
    let aTakeHome = a.calculation.afterTaxIncome;
    let bTakeHome = b.calculation.afterTaxIncome;
    
    // Convert to input currency if needed
    if (aRegionCurrency !== inputCurrency) {
      aTakeHome = inputCurrency === 'USD' ? aTakeHome / exchangeRate : aTakeHome * exchangeRate;
    }
    if (bRegionCurrency !== inputCurrency) {
      bTakeHome = inputCurrency === 'USD' ? bTakeHome / exchangeRate : bTakeHome * exchangeRate;
    }
    
    return bTakeHome - aTakeHome;
  });

  return (
    <div className="w-full">
      <h3 className="text-xs font-medium text-gray-600 text-center mb-6 uppercase tracking-wider">
        Tax Breakdown
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {calculations.map(({ region, calculation, baseIncome }, index) => (
          <div key={`${region.country}-${region.code}`} className="relative">
            {index === 0 && calculations.length > 1 && (
              <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                Lowest Tax
              </div>
            )}
            <TaxBreakdown
              region={region}
              calculation={calculation}
              income={baseIncome}
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