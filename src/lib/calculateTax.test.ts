import { calculateTax, calculateTotalTax } from './calculateTax';

describe('Cross-Currency Tax Calculations', () => {
  const exchangeRate = 1.35; // 1 USD = 1.35 CAD

  describe('Currency conversion for US states', () => {
    it('should handle CAD income for US state correctly', () => {
      // User enters CA$135,000 (equivalent to US$100,000)
      const cadIncome = 135000;
      const usdIncome = cadIncome / exchangeRate; // $100,000 USD
      
      const result = calculateTotalTax(
        usdIncome,
        'US',
        'CA', // California
        'CAD',
        'CAD',
        exchangeRate
      );
      
      // Tax should be calculated on US$100,000
      // Effective rate should be same as if entering US$100,000
      const directUsdResult = calculateTotalTax(100000, 'US', 'CA');
      
      expect(result.effectiveRate).toBeCloseTo(directUsdResult.effectiveRate, 2);
      
      // Brackets should show in US$
      expect(result.bracketCurrency).toBe('US$');
      
      // Federal deduction should be shown in base currency (US$)
      expect(result.federalDeduction).toBe(15750);
    });

    it('should handle USD income for Canadian province correctly', () => {
      // User enters US$100,000 for Ontario
      const usdIncome = 100000;
      const cadIncome = usdIncome * exchangeRate; // $135,000 CAD
      
      const result = calculateTotalTax(
        cadIncome,
        'CA',
        'ON', // Ontario
        'USD',
        'USD',
        exchangeRate
      );
      
      // Tax should be calculated on CA$135,000
      // This should result in higher tax than CA$100,000
      const lowerIncomeResult = calculateTotalTax(100000, 'CA', 'ON');
      
      expect(result.totalTax).toBeGreaterThan(lowerIncomeResult.totalTax);
      
      // Brackets should show in CA$
      expect(result.bracketCurrency).toBe('CA$');
      
      // No deductions for Canadian taxes
      expect(result.federalDeduction).toBe(0);
      expect(result.stateDeduction).toBe(0);
    });
  });

  describe('Tax comparison across borders', () => {
    it('should correctly compare California vs Ontario for same USD amount', () => {
      const usdIncome = 100000;
      
      // California on US$100,000
      const caResult = calculateTotalTax(usdIncome, 'US', 'CA', 'USD', 'USD', exchangeRate);
      
      // Ontario on US$100,000 (CA$135,000)
      const cadEquivalent = usdIncome * exchangeRate;
      const onResult = calculateTotalTax(cadEquivalent, 'CA', 'ON', 'USD', 'USD', exchangeRate);
      
      // Ontario should have higher tax due to higher income in CAD
      expect(onResult.totalTax).toBeGreaterThan(caResult.totalTax);
      
      // Both should show different effective rates
      expect(onResult.effectiveRate).toBeGreaterThan(caResult.effectiveRate);
    });

    it('should correctly compare Texas vs Quebec for same CAD amount', () => {
      const cadIncome = 135000;
      
      // Quebec on CA$135,000
      const qcResult = calculateTotalTax(cadIncome, 'CA', 'QC', 'CAD', 'CAD', exchangeRate);
      
      // Texas on CA$135,000 (US$100,000)
      const usdEquivalent = cadIncome / exchangeRate;
      const txResult = calculateTotalTax(usdEquivalent, 'US', 'TX', 'CAD', 'CAD', exchangeRate);
      
      // Texas has no state tax, should be much lower
      expect(txResult.totalTax).toBeLessThan(qcResult.totalTax);
      expect(txResult.regionalTax).toBe(0);
    });
  });

  describe('Special cases with currency', () => {
    it('should handle Utah tax credit correctly regardless of currency', () => {
      // Test in USD
      const utResultUSD = calculateTax(50000, 'UT');
      const expectedStateTax = Math.max(0, 50000 * 0.0455 - 900);
      expect(utResultUSD.regionalTax).toBe(expectedStateTax);
      
      // Test with CAD input
      const cadIncome = 67500; // CA$67,500 = US$50,000
      const usdIncome = cadIncome / exchangeRate;
      const utResultCAD = calculateTotalTax(
        usdIncome,
        'US',
        'UT',
        'CAD',
        'CAD',
        exchangeRate
      );
      
      // Tax credit should still apply correctly
      expect(utResultCAD.taxCredit).toBe(900); // Credit always in US$
      expect(utResultCAD.regionalTax).toBeCloseTo(expectedStateTax, 2);
    });

    it('should handle states with no income tax correctly', () => {
      const noTaxStates = ['TX', 'FL', 'WA', 'NV', 'SD', 'WY', 'AK', 'TN', 'NH'];
      
      noTaxStates.forEach(state => {
        const result = calculateTax(100000, state);
        expect(result.regionalTax).toBe(0);
        expect(result.totalTax).toBe(result.federalTax);
      });
    });

    it('should handle high income with top brackets', () => {
      const highIncome = 1000000;
      
      // Test US (California)
      const caResult = calculateTax(highIncome, 'CA');
      expect(caResult.effectiveRate).toBeGreaterThan(0.35); // Should be in high 30s
      
      // Test Canada (Ontario)
      const onResult = calculateTax(highIncome, 'ON');
      expect(onResult.effectiveRate).toBeGreaterThan(0.40); // Should be in 40s
    });
  });

  describe('Effective rate consistency', () => {
    it('should maintain consistent effective rate regardless of display currency', () => {
      const baseIncome = 100000; // USD
      
      // Calculate in USD
      const usdResult = calculateTotalTax(
        baseIncome,
        'US',
        'CA',
        'USD',
        'USD',
        exchangeRate
      );
      
      // Calculate same income but display in CAD
      const cadDisplayResult = calculateTotalTax(
        baseIncome,
        'US',
        'CA',
        'USD',
        'CAD',
        exchangeRate
      );
      
      // Effective rate should be identical
      expect(usdResult.effectiveRate).toBe(cadDisplayResult.effectiveRate);
      
      // Total tax should differ by exchange rate
      const expectedCadTax = usdResult.totalTax * exchangeRate;
      expect(cadDisplayResult.totalTax * exchangeRate).toBeCloseTo(expectedCadTax, 2);
    });

    it('should calculate correct effective rate for mixed currency comparison', () => {
      // User with USD income comparing different regions
      const usdIncome = 75000;
      
      // California
      const caResult = calculateTotalTax(usdIncome, 'US', 'CA', 'USD', 'USD', exchangeRate);
      
      // Ontario (needs conversion)
      const cadIncome = usdIncome * exchangeRate;
      const onResult = calculateTotalTax(cadIncome, 'CA', 'ON', 'USD', 'USD', exchangeRate);
      
      // Both should have reasonable effective rates
      expect(caResult.effectiveRate).toBeGreaterThan(10);
      expect(caResult.effectiveRate).toBeLessThan(30);
      expect(onResult.effectiveRate).toBeGreaterThan(15);
      expect(onResult.effectiveRate).toBeLessThan(35);
    });
  });

  describe('Bracket details accuracy', () => {
    it('should show brackets in correct currency', () => {
      // US state should show US$ brackets
      const caResult = calculateTotalTax(100000, 'US', 'CA', 'CAD', 'CAD', exchangeRate);
      expect(caResult.bracketCurrency).toBe('US$');
      expect(caResult.federalBracketDetails[0]).toContain('US$');
      
      // Canadian province should show CA$ brackets
      const onResult = calculateTotalTax(100000, 'CA', 'ON', 'USD', 'USD', exchangeRate);
      expect(onResult.bracketCurrency).toBe('CA$');
      expect(onResult.federalBracketDetails[0]).toContain('CA$');
    });

    it('should calculate bracket taxes correctly with deductions', () => {
      const income = 100000;
      const result = calculateTotalTax(income, 'US', 'CA', 'USD', 'USD', exchangeRate);
      
      // Federal should apply $15,750 deduction
      expect(result.federalDeduction).toBe(15750);
      
      // California should apply $5,540 deduction
      expect(result.stateDeduction).toBe(5540);
      
      // Bracket details should reflect taxable income
      expect(result.federalBracketDetails.length).toBeGreaterThan(0);
      
      // Verify brackets don't exceed taxable income
      const lastBracket = result.federalBracketDetails[result.federalBracketDetails.length - 1];
      expect(lastBracket).toBeDefined();
    });
  });
});