export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface Region {
  name: string;
  country: 'CA' | 'US';
  brackets: TaxBracket[];
}

export interface TaxRates {
  federalTax: {
    CA: TaxBracket[];
    US: {
      brackets: TaxBracket[];
      standardDeduction: number;
    };
  };
  regions: Record<string, Region>;
}

export interface TaxCalculation {
  federalTax: number;
  regionalTax: number;
  totalTax: number;
  effectiveRate: number;
  afterTaxIncome: number;
}

export interface ExchangeRateResponse {
  ForeignExchangeRates: Array<{
    ExchangeRateId: number;
    Rate: string;
    ExchangeRateEffectiveTimestamp: string;
    ExchangeRateExpiryTimestamp: string;
    ExchangeRateSource: string;
    FromCurrency: {
      Value: string;
    };
    FromCurrencyCSN: number;
    ToCurrency: {
      Value: string;
    };
    ToCurrencyCSN: number;
  }>;
}

export type Currency = 'CAD' | 'USD';

export interface SelectedRegion {
  code: string;
  name: string;
  country: 'CA' | 'US';
}