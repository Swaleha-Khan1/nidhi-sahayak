import React, { useState } from 'react';
import { SchemeRecommendation } from '../types';
import { translations } from '../data/translations';
import { calculateEmi, formatFullIndianCurrency, formatIndianCurrency } from '../data/schemes';
import { useApp } from '../context/AppContext';

interface CalculatorScreenProps {
  language?: 'en' | 'hi';
  preselectedScheme?: SchemeRecommendation | null;
  onProceedToChecklist?: (schemeId?: string) => void;
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = () => {
  const {
    language,
    calculatorState,
    updateCalculatorState,
    selectedScheme,
    userProfile,
    setActiveTab,
    selectSchemeAndNavigateToChecklist,
  } = useApp();

  const t = translations[language];

  // If selectedScheme is present and calculator is not yet populated for this scheme, sync directly
  React.useEffect(() => {
    if (selectedScheme && calculatorState.schemeId !== selectedScheme.id) {
      const isFemale = userProfile.gender === 'female';
      const rate = (isFemale && selectedScheme.interestRateWomen)
        ? selectedScheme.interestRateWomen
        : selectedScheme.interestRate;

      updateCalculatorState({
        schemeId: selectedScheme.id,
        schemeNameEn: selectedScheme.nameEn,
        schemeNameHi: selectedScheme.nameHi,
        agency: selectedScheme.agency,
        agencyShort: selectedScheme.agencyShort,
        loanAmount: selectedScheme.maxLoanAmount,
        interestRate: rate,
        tenureMonths: selectedScheme.repaymentMonths || (selectedScheme.repaymentYears * 12) || 36,
        moratoriumMonths: selectedScheme.moratoriumMonths || 0,
        isAutoPopulated: true,
      });
    }
  }, [selectedScheme?.id]);

  const loanAmount = calculatorState.loanAmount;
  const interestRate = calculatorState.interestRate;
  const tenureMonths = calculatorState.tenureMonths;
  const moratoriumMonths = calculatorState.moratoriumMonths;

  const [savedToast, setSavedToast] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // Live recalculation using standard financial formula
  const emiResult = calculateEmi(loanAmount, interestRate, tenureMonths, moratoriumMonths);

  const handleSaveCalculation = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  // Quick Verified Scheme Presets
  const presets = [
    {
      nameEn: 'Micro Finance (≤₹1.4L)',
      nameHi: 'माइक्रो फाइनेंस (≤₹1.4L)',
      amount: 140000,
      rate: 5.0,
      tenure: 36,
      moratorium: 3,
    },
    {
      nameEn: 'Term Loan (₹10L)',
      nameHi: 'टर्म लोन (₹10L)',
      amount: 1000000,
      rate: 6.0,
      tenure: 84,
      moratorium: 6,
    },
    {
      nameEn: 'Education India (₹20L)',
      nameHi: 'शिक्षा भारत (₹20L)',
      amount: 2000000,
      rate: 4.0,
      tenure: 120,
      moratorium: 12,
    },
    {
      nameEn: 'PM SVANidhi (₹20K)',
      nameHi: 'पीएम स्वनिधि (₹20K)',
      amount: 20000,
      rate: 7.0,
      tenure: 18,
      moratorium: 1,
    },
  ];

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary mb-1">
          {t.calculatorTitle}
        </h2>
        <p className="font-body text-sm text-on-surface-variant">
          {t.calculatorSubtitle}
        </p>
      </div>

      {/* Linked Scheme Banner - Single Source of Truth from Recommender */}
      {calculatorState.schemeNameEn && (
        <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-4 flex items-start justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-start gap-3">
            <span
              className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary text-on-primary">
                  {calculatorState.agencyShort || 'SCHEME'}
                </span>
                <h3 className="font-headline text-base font-bold text-primary">
                  {language === 'hi' && calculatorState.schemeNameHi
                    ? calculatorState.schemeNameHi
                    : calculatorState.schemeNameEn}
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                {language === 'hi'
                  ? `चयनित योजना से स्वतः भरा गया: ब्याज दर ${calculatorState.interestRate}% प्रति वर्ष • ऋण राशि ${formatFullIndianCurrency(calculatorState.loanAmount)} • अवधि ${calculatorState.tenureMonths} माह (${Math.round((calculatorState.tenureMonths / 12) * 10) / 10} वर्ष) • अधिस्थगन ${calculatorState.moratoriumMonths} माह`
                  : `Auto-populated from selected scheme: ${calculatorState.interestRate}% p.a. • Loan Amount ${formatFullIndianCurrency(calculatorState.loanAmount)} • ${calculatorState.tenureMonths} Months tenure (${Math.round((calculatorState.tenureMonths / 12) * 10) / 10} Yrs) • ${calculatorState.moratoriumMonths} Months holiday`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              updateCalculatorState({
                schemeNameEn: null,
                schemeNameHi: null,
                agencyShort: null,
                isAutoPopulated: false,
              })
            }
            className="text-on-surface-variant hover:text-primary text-xs font-semibold px-2 py-1 rounded-md border border-outline-variant/40 hover:bg-surface-bright transition-all shrink-0 cursor-pointer"
            title="Clear scheme linkage"
          >
            {language === 'hi' ? 'कस्टम मोड' : 'Custom Mode'}
          </button>
        </div>
      )}

      {/* Quick Scheme Presets */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-body font-bold text-on-surface-variant">
          {t.quickPresets}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                updateCalculatorState({
                  schemeId: null,
                  schemeNameEn: p.nameEn,
                  schemeNameHi: p.nameHi,
                  agencyShort: 'PRESET',
                  loanAmount: p.amount,
                  interestRate: p.rate,
                  tenureMonths: p.tenure,
                  moratoriumMonths: p.moratorium,
                  isAutoPopulated: false,
                });
              }}
              className="py-2 px-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40 hover:bg-primary-fixed/30 text-xs font-semibold text-left transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              <span className="font-bold block text-primary truncate">
                {language === 'hi' ? p.nameHi : p.nameEn}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {p.rate}% • {p.tenure / 12} Yrs • {formatIndianCurrency(p.amount)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Input Form */}
        <section className="space-y-4 bg-surface-container-lowest shadow-[0_4px_16px_rgba(0,6,102,0.08)] p-5 rounded-2xl border-l-4 border-primary">
          {/* Loan Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-body font-bold text-sm text-on-surface">
                {t.loanAmount}
              </label>
              <span className="font-headline text-lg md:text-xl font-bold text-primary">
                {formatFullIndianCurrency(loanAmount)}
              </span>
            </div>

            <input
              type="range"
              min="10000"
              max="5000000"
              step="10000"
              value={loanAmount}
              onChange={(e) => updateCalculatorState({ loanAmount: parseInt(e.target.value, 10) })}
              className="custom-range-slider my-2 w-full h-3 bg-surface-container-high rounded-lg cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-on-surface-variant font-medium">
              <span>₹10K</span>
              <span>₹1.4L</span>
              <span>₹10L</span>
              <span>₹50L</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block font-body font-bold text-sm text-on-surface mb-1">
              {t.interestRateInput}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1"
                max="25"
                value={interestRate}
                onChange={(e) => updateCalculatorState({ interestRate: parseFloat(e.target.value) || 1 })}
                className="w-full min-h-[46px] px-3.5 pr-8 rounded-xl border border-primary/20 bg-surface focus:ring-2 focus:ring-primary/20 text-sm font-bold text-on-surface outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                %
              </span>
            </div>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              {t.interestRateHelp}
            </p>
          </div>

          {/* Tenure (Months) */}
          <div>
            <label className="block font-body font-bold text-sm text-on-surface mb-1">
              {t.tenureMonths} ({Math.round((tenureMonths / 12) * 10) / 10} Years)
            </label>
            <div className="relative">
              <input
                type="number"
                min="6"
                max="180"
                step="6"
                value={tenureMonths}
                onChange={(e) => updateCalculatorState({ tenureMonths: parseInt(e.target.value, 10) || 12 })}
                className="w-full min-h-[46px] px-3.5 pr-14 rounded-xl border border-primary/20 bg-surface focus:ring-2 focus:ring-primary/20 text-sm font-bold text-on-surface outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-semibold">
                Months
              </span>
            </div>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              {t.tenureHelp}
            </p>
          </div>

          {/* Holiday / Moratorium */}
          <div>
            <label className="block font-body font-bold text-sm text-on-surface mb-1">
              {t.holidayPeriod}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="24"
                step="1"
                value={moratoriumMonths}
                onChange={(e) => updateCalculatorState({ moratoriumMonths: parseInt(e.target.value, 10) || 0 })}
                className="w-full min-h-[46px] px-3.5 pr-14 rounded-xl border border-primary/20 bg-surface focus:ring-2 focus:ring-primary/20 text-sm font-bold text-on-surface outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-semibold">
                Months
              </span>
            </div>
            <p className="mt-1 text-[11px] text-on-surface-variant">
              {t.holidayHelp}
            </p>
          </div>
        </section>

        {/* Right Column: Calculated Results */}
        <section className="space-y-4">
          {/* Main Hero Result Card */}
          <div className="bg-primary text-on-primary p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,6,102,0.18)] flex flex-col gap-4">
            <div>
              <h3 className="font-body font-bold text-xs uppercase tracking-wider opacity-85">
                {t.estimatedEmi}
              </h3>
              <div className="font-headline text-3xl md:text-4xl font-bold tracking-tight mt-1">
                {formatFullIndianCurrency(emiResult.monthlyEmi)}
                <span className="text-xs font-normal opacity-80 ml-1">/ month</span>
              </div>
            </div>

            <div className="h-px bg-on-primary/20 w-full" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs opacity-85">{t.totalRepayment}</span>
                <span className="font-headline text-lg font-bold">
                  {formatFullIndianCurrency(emiResult.totalRepayment)}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs opacity-85">{t.totalInterest}</span>
                <span className="font-headline text-lg font-bold text-secondary-fixed">
                  {formatFullIndianCurrency(emiResult.totalInterest)}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Bar (Principal vs Interest) */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-[0_4px_16px_rgba(0,6,102,0.08)] border border-outline-variant/30 flex flex-col gap-3">
            <h4 className="font-body font-bold text-xs text-on-surface uppercase tracking-wider">
              {t.breakdown}
            </h4>

            <div className="flex h-7 w-full rounded-full overflow-hidden shadow-inner bg-surface-variant p-0.5">
              <div
                className="bg-primary h-full rounded-l-full transition-all duration-300 flex items-center justify-center text-[10px] text-on-primary font-bold"
                style={{ width: `${emiResult.principalPercentage}%` }}
              >
                {emiResult.principalPercentage > 15 ? `${emiResult.principalPercentage}%` : ''}
              </div>
              <div
                className="bg-secondary-container h-full rounded-r-full transition-all duration-300 flex items-center justify-center text-[10px] text-on-secondary-container font-bold"
                style={{ width: `${emiResult.interestPercentage}%` }}
              >
                {emiResult.interestPercentage > 15 ? `${emiResult.interestPercentage}%` : ''}
              </div>
            </div>

            <div className="flex justify-between text-xs font-semibold px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-on-surface-variant">{t.principal}: {emiResult.principalPercentage}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-secondary-container" />
                <span className="text-on-surface-variant">{t.interest}: {emiResult.interestPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Moratorium Notice Box */}
          {moratoriumMonths > 0 && (
            <div className="bg-secondary-fixed/30 border border-secondary-container/40 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
              <span
                className="material-symbols-outlined text-secondary text-xl shrink-0 mt-0.5"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                info
              </span>
              <div>
                <h4 className="font-body font-bold text-on-surface">
                  {t.moratoriumApplied} ({moratoriumMonths} Months)
                </h4>
                <p className="text-on-surface-variant mt-0.5">
                  {t.moratoriumNotice.replace('{n}', moratoriumMonths.toString())}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleSaveCalculation}
              className="w-full min-h-[50px] bg-primary text-on-primary rounded-xl font-body font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              <span>{t.saveCalculation}</span>
            </button>

            {savedToast && (
              <div className="bg-tertiary-container text-on-tertiary px-3.5 py-2 rounded-lg text-xs font-bold text-center animate-pop-glow">
                ✓ {t.savedNotice}
              </div>
            )}

            <button
              onClick={() => {
                if (selectedScheme) {
                  selectSchemeAndNavigateToChecklist(selectedScheme);
                } else {
                  setActiveTab('checklist');
                }
              }}
              className="w-full min-h-[46px] bg-surface-container-high hover:bg-primary-fixed text-primary border border-primary/20 rounded-xl font-body font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{t.checklistTitle} →</span>
            </button>

            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="text-xs font-bold text-primary hover:underline text-center pt-1 cursor-pointer"
            >
              {showSchedule ? t.hideAmortization : t.showAmortization}
            </button>
          </div>
        </section>
      </div>

      {/* Amortization Schedule Table */}
      {showSchedule && (
        <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,6,102,0.08)] border border-outline-variant/30 overflow-hidden animate-pop-glow">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-headline text-lg font-bold text-primary">
              Amortization Schedule ({emiResult.schedule.length} Months)
            </h3>
            <span className="text-xs text-on-surface-variant font-semibold">
              Formula: P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-surface-variant text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-high sticky top-0 font-bold text-on-surface">
                <tr>
                  <th className="p-2.5">{t.month}</th>
                  <th className="p-2.5">EMI (₹)</th>
                  <th className="p-2.5">{t.principal} (₹)</th>
                  <th className="p-2.5">{t.interest} (₹)</th>
                  <th className="p-2.5">{t.openingBal} (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {emiResult.schedule.map((row) => (
                  <tr
                    key={row.month}
                    className={`hover:bg-surface-container-low transition-colors ${
                      row.isMoratorium ? 'bg-secondary-fixed/20 text-secondary' : ''
                    }`}
                  >
                    <td className="p-2.5 font-bold">
                      {row.month} {row.isMoratorium && '(Holiday)'}
                    </td>
                    <td className="p-2.5 font-semibold">
                      {row.isMoratorium ? '₹0 (Holiday)' : `₹${row.emi.toLocaleString('en-IN')}`}
                    </td>
                    <td className="p-2.5">₹{row.principal.toLocaleString('en-IN')}</td>
                    <td className="p-2.5">₹{row.interest.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 font-semibold">₹{row.balance.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
