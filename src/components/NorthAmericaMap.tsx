'use client';

import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { feature } from 'topojson-client';
import { SelectedRegion, Currency } from '@/types';
import { calculateTotalTax } from '@/lib/calculateTax';
import taxRates from '@/data/taxRates.json';
import type { FeatureCollection } from 'geojson';

const usStatesUrl = "/maps/us-states.json";
const canadaProvincesUrl = "/maps/canada-provinces.json";

const US_STATE_MAP: Record<string, string> = {
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY',
  'District of Columbia': 'DC'
};

const CANADA_PROVINCE_MAP: Record<string, string> = {
  'Ontario': 'ON',
  'Quebec': 'QC',
  'British Columbia': 'BC',
  'Alberta': 'AB',
  'Manitoba': 'MB',
  'Saskatchewan': 'SK',
  'Nova Scotia': 'NS',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Prince Edward Island': 'PE',
  'Northwest Territories': 'NT',
  'Yukon Territory': 'YT',
  'Nunavut': 'NU'
};

interface NorthAmericaMapProps {
  selectedRegions: SelectedRegion[];
  onRegionToggle: (region: SelectedRegion) => void;
  income: number;
  inputCurrency: Currency;
  exchangeRate: number;
}

export default function NorthAmericaMap({ 
  selectedRegions, 
  onRegionToggle,
  income,
  inputCurrency,
  exchangeRate
}: NorthAmericaMapProps) {
  const [usGeo, setUsGeo] = useState<FeatureCollection | null>(null);
  const [canadaGeo, setCanadaGeo] = useState<FeatureCollection | null>(null);
  interface TaxData {
    effectiveRate: number;
    federalTax: number;
    regionalTax: number;
    totalTax: number;
    federalTaxDisplay: number;
    regionalTaxDisplay: number;
    totalTaxDisplay: number;
    federalDeduction: number;
    stateDeduction: number;
    taxCredit: number;
    federalBracketDetails: string[];
    regionalBracketDetails: string[];
    nativeCurrency: string;
    userCurrency: string;
    needsConversion: boolean;
    baseIncome: number;
    inputIncome: number;
  }
  
  const [taxRatesByRegion, setTaxRatesByRegion] = useState<Record<string, TaxData>>({});
  const [hoveredRegion, setHoveredRegion] = useState<TaxData & { name: string; country: string } | null>(null);

  useEffect(() => {
    fetch(usStatesUrl)
      .then(response => response.json())
      .then(topology => {
        const geo = feature(topology, topology.objects.states) as unknown as FeatureCollection;
        setUsGeo(geo as FeatureCollection);
      });
    
    fetch(canadaProvincesUrl)
      .then(response => response.json())
      .then(data => {
        setCanadaGeo(data as FeatureCollection);
      });
  }, []);

  useEffect(() => {
    if (income === 0) {
      setTaxRatesByRegion({});
      return;
    }

    const rates: Record<string, TaxData> = {};
    
    Object.entries(taxRates.regions).forEach(([code, region]) => {
      const regionCurrency = region.country === 'CA' ? 'CAD' : 'USD';
      const baseIncome = inputCurrency === regionCurrency ? income : 
                         inputCurrency === 'USD' ? income * exchangeRate : 
                         income / exchangeRate;
      
      const taxData = calculateTotalTax(
        baseIncome,
        region.country as "CA" | "US",
        code,
        inputCurrency,
        inputCurrency,
        exchangeRate
      );
      
      rates[`${region.country}-${code}`] = {
        ...taxData,
        baseIncome,
        inputIncome: income
      };
    });
    
    setTaxRatesByRegion(rates);
  }, [income, inputCurrency, exchangeRate]);

  const isSelected = (code: string, country: 'CA' | 'US') => {
    return selectedRegions.some(r => r.code === code && r.country === country);
  };

  const handleRegionClick = (name: string, country: 'CA' | 'US') => {
    let code: string | undefined;
    
    if (country === 'US') {
      code = US_STATE_MAP[name];
    } else {
      code = CANADA_PROVINCE_MAP[name];
    }
    
    if (code && taxRates.regions[code as keyof typeof taxRates.regions]) {
      onRegionToggle({
        code,
        name: taxRates.regions[code as keyof typeof taxRates.regions].name,
        country
      });
    }
  };

  const getFillColor = (name: string, country: 'CA' | 'US') => {
    const code = country === 'US' ? US_STATE_MAP[name] : CANADA_PROVINCE_MAP[name];
    
    if (!code || !taxRates.regions[code as keyof typeof taxRates.regions]) {
      return '#f9fafb';
    }
    
    if (isSelected(code, country)) {
      return '#6366f1'; // Indigo color for selected
    }
    
    // Color based on tax rate if income is set
    const taxData = taxRatesByRegion[`${country}-${code}`];
    if (taxData && income > 0) {
      const effectiveRate = taxData.effectiveRate;
      // Color scale from green (low tax) to red (high tax)
      // Rates typically range from 0% to 50%
      if (effectiveRate < 15) return '#dcfce7'; // light green
      if (effectiveRate < 20) return '#bbf7d0';
      if (effectiveRate < 25) return '#fef3c7'; // light yellow
      if (effectiveRate < 30) return '#fed7aa'; // light orange
      if (effectiveRate < 35) return '#fecaca'; // light red
      return '#fca5a5'; // red
    }
    
    return '#e5e7eb';
  };

  return (
    <div className="w-full">
      <div className="aspect-[3/2] w-full max-w-2xl mx-auto bg-gray-50 rounded-lg overflow-hidden relative">
        <ComposableMap
          projection="geoAlbers"
          projectionConfig={{
            scale: 500,
            center: [-95, 52]
          }}
        >
          <ZoomableGroup zoom={1} minZoom={0.5} maxZoom={3} center={[-95, 52]}>
            {usGeo && (
              <Geographies geography={usGeo}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const name = geo.properties.name;
                    const code = US_STATE_MAP[name];
                    const hasData = code && taxRates.regions[code as keyof typeof taxRates.regions];
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => hasData && handleRegionClick(name, 'US')}
                        onMouseEnter={() => {
                          if (hasData && income > 0) {
                            const taxData = taxRatesByRegion[`US-${code}`];
                            if (taxData) {
                              setHoveredRegion({ 
                                name, 
                                ...taxData,
                                country: 'US'
                              });
                            }
                          }
                        }}
                        onMouseLeave={() => setHoveredRegion(null)}
                        style={{
                          default: {
                            fill: getFillColor(name, 'US'),
                            stroke: '#fff',
                            strokeWidth: 0.75,
                            outline: 'none',
                          },
                          hover: {
                            fill: hasData ? (isSelected(code!, 'US') ? '#4f46e5' : '#9ca3af') : '#f9fafb',
                            stroke: '#fff',
                            strokeWidth: 0.75,
                            outline: 'none',
                            cursor: hasData ? 'pointer' : 'default',
                          },
                          pressed: {
                            fill: '#4338ca',
                            stroke: '#fff',
                            strokeWidth: 0.75,
                            outline: 'none',
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            )}
            
            {canadaGeo && (
              <Geographies geography={canadaGeo}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const name = geo.properties.name;
                    const code = CANADA_PROVINCE_MAP[name];
                    const hasData = code && taxRates.regions[code as keyof typeof taxRates.regions];
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => hasData && handleRegionClick(name, 'CA')}
                        onMouseEnter={() => {
                          if (hasData && income > 0) {
                            const taxData = taxRatesByRegion[`CA-${code}`];
                            if (taxData) {
                              setHoveredRegion({ 
                                name, 
                                ...taxData,
                                country: 'CA'
                              });
                            }
                          }
                        }}
                        onMouseLeave={() => setHoveredRegion(null)}
                        style={{
                          default: {
                            fill: getFillColor(name, 'CA'),
                            stroke: '#fff',
                            strokeWidth: 0.75,
                            outline: 'none',
                          },
                          hover: {
                            fill: hasData ? (isSelected(code!, 'CA') ? '#4f46e5' : '#9ca3af') : '#f9fafb',
                            stroke: '#fff',
                            strokeWidth: 0.75,
                            outline: 'none',
                            cursor: hasData ? 'pointer' : 'default',
                          },
                          pressed: {
                            fill: '#4338ca',
                            stroke: '#fff',
                            strokeWidth: 0.75,
                            outline: 'none',
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            )}
          </ZoomableGroup>
        </ComposableMap>
        
        {hoveredRegion && (
          <div className="absolute top-2 left-2 bg-white rounded-lg shadow-lg px-3 py-2 pointer-events-none max-w-md">
            <div className="font-medium text-sm text-gray-900">{hoveredRegion.name}</div>
            <div className="text-xs text-gray-600 space-y-2 mt-1">
              <div className="font-medium">Effective tax rate: {hoveredRegion.effectiveRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">
                Income: {hoveredRegion.userCurrency}{hoveredRegion.inputIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {hoveredRegion.needsConversion && (
                  <span className="ml-1">
                    (= {hoveredRegion.nativeCurrency}{hoveredRegion.baseIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                )}
              </div>
              
              <div className="border-t pt-1">
                <div className="font-medium">
                  Federal Tax: {hoveredRegion.nativeCurrency}{hoveredRegion.federalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  {hoveredRegion.needsConversion && (
                    <span className="ml-1 font-normal">
                      (= {hoveredRegion.userCurrency}{hoveredRegion.federalTaxDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                    </span>
                  )}
                </div>
                {hoveredRegion.federalDeduction > 0 && (
                  <div className="text-xs text-gray-500">Standard deduction: {hoveredRegion.nativeCurrency}{hoveredRegion.federalDeduction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                )}
                {hoveredRegion.federalBracketDetails.length > 0 && (
                  <div className="ml-2 text-xs text-gray-500">
                    {hoveredRegion.federalBracketDetails.map((detail: string, i: number) => (
                      <div key={i}>{detail}</div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t pt-1">
                <div className="font-medium">
                  {hoveredRegion.country === 'CA' ? 'Provincial' : 'State'} Tax: {hoveredRegion.nativeCurrency}{hoveredRegion.regionalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  {hoveredRegion.needsConversion && (
                    <span className="ml-1 font-normal">
                      (= {hoveredRegion.userCurrency}{hoveredRegion.regionalTaxDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                    </span>
                  )}
                </div>
                {hoveredRegion.stateDeduction > 0 && (
                  <div className="text-xs text-gray-500">Standard deduction: {hoveredRegion.nativeCurrency}{hoveredRegion.stateDeduction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                )}
                {hoveredRegion.taxCredit > 0 && (
                  <div className="text-xs text-gray-500">Tax credit: {hoveredRegion.nativeCurrency}{hoveredRegion.taxCredit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                )}
                {hoveredRegion.regionalBracketDetails.length > 0 && (
                  <div className="ml-2 text-xs text-gray-500">
                    {hoveredRegion.regionalBracketDetails.map((detail: string, i: number) => (
                      <div key={i}>{detail}</div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t pt-1 font-medium">
                Total Tax: {hoveredRegion.nativeCurrency}{hoveredRegion.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {hoveredRegion.needsConversion && (
                  <span className="ml-1 font-normal">
                    (= {hoveredRegion.userCurrency}{hoveredRegion.totalTaxDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="text-center text-xs text-gray-400">
          Drag to pan • Scroll to zoom • Click regions to select
        </div>
        
        {income > 0 && (
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>Lower Tax</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dcfce7' }}></div>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#bbf7d0' }}></div>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fef3c7' }}></div>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fed7aa' }}></div>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fecaca' }}></div>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fca5a5' }}></div>
            </div>
            <span>Higher Tax</span>
          </div>
        )}
      </div>
      
      {selectedRegions.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-gray-500 text-center mb-3 uppercase tracking-wider">Selected Regions</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedRegions.map(region => (
              <button
                key={`${region.country}-${region.code}`}
                onClick={() => onRegionToggle(region)}
                className="px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-full text-sm transition-colors"
              >
                <span className="mr-1.5">{region.country === 'CA' ? '🇨🇦' : '🇺🇸'}</span>
                {region.name}
                <span className="ml-2 text-gray-400">×</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}