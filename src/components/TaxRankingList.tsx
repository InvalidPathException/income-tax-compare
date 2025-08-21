'use client';

import { useState } from 'react';
import { Currency } from '@/types';
import { calculateTotalTax } from '@/lib/calculateTax';
import taxRates from '@/data/taxRates.json';

interface TaxRankingListProps {
  income: number;
  displayCurrency: Currency;
  inputCurrency: Currency;
  exchangeRate: number;
}

export default function TaxRankingList({ 
  income, 
  displayCurrency, 
  inputCurrency, 
  exchangeRate 
}: TaxRankingListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (income === 0) return null;

  // Calculate taxes for all regions
  const allRegions = Object.entries(taxRates.regions).map(([code, region]) => {
    const baseIncome = inputCurrency === region.country ? income : 
                       inputCurrency === 'USD' ? income * exchangeRate : 
                       income / exchangeRate;
    
    const { totalTax, effectiveRate } = calculateTotalTax(
      baseIncome,
      region.country as "CA" | "US",
      code
    );

    const displayTax = displayCurrency === region.country ? totalTax :
                       displayCurrency === 'USD' ? totalTax / exchangeRate :
                       totalTax * exchangeRate;

    return {
      code,
      name: region.name,
      country: region.country,
      totalTax: displayTax,
      effectiveRate,
      netIncome: income - displayTax
    };
  });

  // Sort by total tax (highest to lowest)
  const sortedRegions = allRegions.sort((a, b) => b.totalTax - a.totalTax);

  // Get worst (highest tax) and best (lowest tax) for summary
  const worst = sortedRegions[0];
  const best = sortedRegions[sortedRegions.length - 1];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wider">
            Tax Rankings
          </h2>
          <span className="text-gray-400">
            {isExpanded ? '−' : '+'}
          </span>
        </div>
        
        {!isExpanded && (
          <div className="mt-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>
                <span className="mr-1.5">{worst.country === 'CA' ? '🇨🇦' : '🇺🇸'}</span>
                Highest: {worst.name}
              </span>
              <span className="font-medium">
                {displayCurrency} {worst.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span>
                <span className="mr-1.5">{best.country === 'CA' ? '🇨🇦' : '🇺🇸'}</span>
                Lowest: {best.name}
              </span>
              <span className="font-medium">
                {displayCurrency} {best.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="mt-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedRegions.map((region, index) => {
              const percentDiff = index === sortedRegions.length - 1 ? 0 : 
                ((worst.totalTax - region.totalTax) / region.totalTax * 100);
              
              return (
                <div 
                  key={`${region.country}-${region.code}`}
                  className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 w-6">
                      {index + 1}
                    </span>
                    <span className="text-lg">
                      {region.country === 'CA' ? '🇨🇦' : '🇺🇸'}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {region.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {region.effectiveRate.toFixed(1)}% effective rate
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {displayCurrency} {region.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    {index < sortedRegions.length - 1 && (
                      <div className="text-xs text-gray-500">
                        -{((worst.totalTax - region.totalTax) / worst.totalTax * 100).toFixed(1)}% vs highest
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}