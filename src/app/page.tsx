'use client';

import { useState, useEffect } from 'react';
import IncomeInput from '@/components/IncomeInput';
import NorthAmericaMap from '@/components/NorthAmericaMap';
import ComparisonGrid from '@/components/ComparisonGrid';
import TaxRankingList from '@/components/TaxRankingList';
import { Currency, SelectedRegion } from '@/types';
import { getExchangeRate } from '@/lib/exchangeRate';

export default function Home() {
  const [income, setIncome] = useState('100,000');
  const [inputCurrency, setInputCurrency] = useState<Currency>('CAD');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('CAD');
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);
  const [exchangeRate, setExchangeRate] = useState(1.35);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const fetchExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const rate = await getExchangeRate();
      setExchangeRate(rate);
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const handleRegionToggle = (region: SelectedRegion) => {
    setSelectedRegions(prev => {
      const exists = prev.some(r => r.code === region.code && r.country === region.country);
      if (exists) {
        return prev.filter(r => !(r.code === region.code && r.country === region.country));
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), region];
      }
      return [...prev, region];
    });
  };

  const handleCurrencyChange = (currency: Currency) => {
    setInputCurrency(currency);
    setDisplayCurrency(currency);
  };

  const getNumericIncome = () => {
    return parseInt(income.replace(/[^0-9]/g, '') || '0');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fff5f5' }}>
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <header className="py-12">
          <h1 className="text-2xl font-semibold text-center text-gray-900">
            North American Combined Income Tax Comparison
          </h1>
        </header>

        {/* Main Content */}
        <main className="space-y-8 pb-20">
          
          {/* Income Input with Exchange Rate */}
          <div>
            <IncomeInput
              income={income}
              setIncome={setIncome}
              currency={inputCurrency}
              setCurrency={handleCurrencyChange}
              exchangeRate={exchangeRate}
              isLoadingRate={isLoadingRate}
              onRefreshRate={fetchExchangeRate}
            />
          </div>

          {/* Map */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-600 text-center mb-4 uppercase tracking-wider">
              Select Regions
            </h2>
            <NorthAmericaMap
              selectedRegions={selectedRegions}
              onRegionToggle={handleRegionToggle}
              income={getNumericIncome()}
              inputCurrency={inputCurrency}
              exchangeRate={exchangeRate}
            />
          </div>

          {/* Comparison Grid */}
          {selectedRegions.length > 0 && getNumericIncome() > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <ComparisonGrid
                selectedRegions={selectedRegions}
                income={getNumericIncome()}
                displayCurrency={displayCurrency}
                inputCurrency={inputCurrency}
                exchangeRate={exchangeRate}
              />
            </div>
          )}

          {/* Tax Rankings */}
          {getNumericIncome() > 0 && (
            <TaxRankingList
              income={getNumericIncome()}
              displayCurrency={displayCurrency}
              inputCurrency={inputCurrency}
              exchangeRate={exchangeRate}
            />
          )}

          {/* Footer */}
          <footer className="pt-12 text-center text-xs text-gray-500">
            <p>2025 tax rates · Single filer · Federal and state/provincial taxes only</p>
          </footer>
        </main>
      </div>
    </div>
  );
}