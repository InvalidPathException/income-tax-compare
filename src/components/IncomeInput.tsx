'use client';

import { Currency } from '@/types';

interface IncomeInputProps {
  income: string;
  setIncome: (income: string) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  isLoadingRate: boolean;
  onRefreshRate: () => void;
}

export default function IncomeInput({ 
  income, 
  setIncome, 
  currency, 
  setCurrency,
  exchangeRate,
  isLoadingRate,
  onRefreshRate
}: IncomeInputProps) {
  const formatNumber = (value: string) => {
    const num = value.replace(/[^0-9]/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString();
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setIncome(formatted);
  };

  const toggleCurrency = () => {
    setCurrency(currency === 'CAD' ? 'USD' : 'CAD');
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <label htmlFor="income" className="block text-xs font-medium text-gray-600 text-center mb-2 uppercase tracking-wider">
            Annual Taxable Income
          </label>
          <div className="flex">
            <button
              onClick={toggleCurrency}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-l-md font-medium transition-colors border border-r-0 border-gray-300 text-sm"
              type="button"
            >
              {currency}
            </button>
            <input
              id="income"
              type="text"
              value={income}
              onChange={handleIncomeChange}
              placeholder="100,000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-center font-medium text-sm"
            />
          </div>
          <div className="mt-2 text-center">
            <button
              onClick={onRefreshRate}
              disabled={isLoadingRate}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isLoadingRate ? 'Loading...' : `1 USD = ${exchangeRate.toFixed(4)} CAD`}
              <span className="ml-1.5 text-xs">↻</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}