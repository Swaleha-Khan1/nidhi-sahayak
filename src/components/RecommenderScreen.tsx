import React, { useState, useEffect, useRef } from 'react';
import { SchemeRecommendation, UserProfile } from '../types';
import { translations } from '../data/translations';
import { evaluateEligibility, formatIndianCurrency, formatFullIndianCurrency } from '../data/schemes';
import { useApp } from '../context/AppContext';

interface RecommenderScreenProps {
  language?: 'en' | 'hi';
  profile?: UserProfile;
  onUpdateCost?: (newCost: number) => void;
  onProceedToCalculator?: (scheme: SchemeRecommendation) => void;
  onProceedToChecklist?: (scheme: SchemeRecommendation) => void;
}

export const RecommenderScreen: React.FC<RecommenderScreenProps> = () => {
  const {
    language,
    userProfile,
    updateUserProfile,
    setActiveTab,
    selectSchemeAndNavigateToCalculator,
    selectSchemeAndNavigateToChecklist,
  } = useApp();

  const t = translations[language];
  const [sliderValue, setSliderValue] = useState<number>(userProfile.projectCost || 120000);
  const [previousSchemeId, setPreviousSchemeId] = useState<string>('');
  const [animatePop, setAnimatePop] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiExplainError, setAiExplainError] = useState<string | null>(null);
  const [isAiExplaining, setIsAiExplaining] = useState(false);
  const particlesContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize local slider with userProfile.projectCost
  useEffect(() => {
    if (typeof userProfile.projectCost === 'number' && userProfile.projectCost > 0) {
      setSliderValue(userProfile.projectCost);
      setAiExplanation(null);
      setAiExplainError(null);
    }
  }, [userProfile.projectCost, userProfile.purpose, userProfile.educationLocation]);

  // Evaluate eligibility using dataset-driven rule engine
  const currentProfile: UserProfile = { ...userProfile, projectCost: sliderValue };
  const evalResult = evaluateEligibility(currentProfile);

  const {
    hasSufficientData,
    isGatePassed,
    gateFailureReasonEn,
    gateFailureReasonHi,
    isFallbackActive,
    primaryScheme,
    allEligibleSchemes,
    nearMisses,
  } = evalResult;

  const isEducation = userProfile.purpose === 'education';
  const sliderMax = isEducation ? (userProfile.educationLocation === 'abroad' ? 4000000 : 3000000) : 5000000;

  // Trigger pop glow animation & particles when scheme changes dynamically across threshold
  useEffect(() => {
    if (primaryScheme && previousSchemeId && previousSchemeId !== primaryScheme.id) {
      setAnimatePop(true);
      createParticles();
      const timer = setTimeout(() => setAnimatePop(false), 600);
      return () => clearTimeout(timer);
    }
    if (primaryScheme) {
      setPreviousSchemeId(primaryScheme.id);
    }
  }, [primaryScheme?.id]);

  const createParticles = () => {
    if (!particlesContainerRef.current) return;
    const container = particlesContainerRef.current;
    container.innerHTML = '';
    const colors = ['#1a237e', '#ff8f00', '#5aa958'];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('div');
      p.className = 'particle rounded-full absolute pointer-events-none';
      const size = Math.random() * 6 + 4;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * Math.PI * 2;
      const velocity = 35 + Math.random() * 45;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity - 25;
      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);
      p.style.left = '50%';
      p.style.top = '50%';
      p.style.animation = 'particleAnim 0.8s ease-out forwards';
      container.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSliderValue(val);
    updateUserProfile({ projectCost: val });
    setAiExplanation(null);
    setAiExplainError(null);
  };

  // Helper text under slider based on cost threshold
  const getSliderHelpText = () => {
    if (isEducation) {
      const isAbroad = userProfile.educationLocation === 'abroad';
      const cap = isAbroad ? '₹40 Lakh' : '₹30 Lakh';
      return language === 'hi'
        ? `शिक्षा ऋण ${isAbroad ? 'विदेश' : 'भारत'} में अध्ययन हेतु अधिकतम ${cap} तक कवर करता है।`
        : `Education Loan covers course fees up to ${cap} for studies ${isAbroad ? 'abroad' : 'in India'}.`;
    }
    if (sliderValue <= 140000) {
      return t.sliderHelpMicro;
    }
    if (sliderValue <= 5000000) {
      return t.sliderHelpTerm;
    }
    return t.sliderHelpCap;
  };

  // Generate AI Explanation for current scheme
  const handleExplainWithAi = async () => {
    if (!primaryScheme) return;
    setIsAiExplaining(true);
    setAiExplanation(null);
    setAiExplainError(null);
    try {
      const response = await fetch('/api/ai/explain-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeName: primaryScheme.nameEn,
          agency: primaryScheme.agency,
          projectCost: sliderValue,
          annualIncome: userProfile.annualIncome,
          userCategory: userProfile.category,
          language,
        }),
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || 'Failed to generate explanation');
      }
      const data = await response.json();
      setAiExplanation(data.explanation);
    } catch (err: any) {
      console.error(err);
      // Visible error state instead of silent fallback to default values
      setAiExplainError(
        language === 'hi'
          ? 'एआई व्याख्या सेवा अस्थायी रूप से अनुपलब्ध है। कृपया पुनः प्रयास करें।'
          : 'AI explanation service is temporarily unavailable. Please try again.'
      );
    } finally {
      setIsAiExplaining(false);
    }
  };

  // If user profile is incomplete or unextracted, show empty state instead of false recommendations
  if (!hasSufficientData || !primaryScheme) {
    return (
      <div className="w-full max-w-[840px] mx-auto px-4 md:px-6 py-10 flex flex-col items-center justify-center">
        <div className="w-full bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/30 card-shadow flex flex-col items-center text-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-4xl">travel_explore</span>
          </div>
          <h2 className="font-headline text-2xl font-bold text-primary">
            {t.noProfileTitle}
          </h2>
          <p className="font-body text-sm text-on-surface-variant max-w-md leading-relaxed">
            {t.noProfileDesc}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('intake')}
            className="mt-2 px-6 py-3 bg-primary text-on-primary font-body font-bold text-sm rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            <span>{t.goToSmartIntake}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-6 relative">
      {/* Invisible particle layer for threshold animation */}
      <div ref={particlesContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-20" />

      {/* Screen Header */}
      <div className="flex flex-col gap-1">
        <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary">
          {t.matchesTitle}
        </h2>
        <p className="font-body text-xs md:text-sm text-on-surface-variant">
          {t.matchesSubtitle}
        </p>
      </div>

      {/* Dynamic Interactive Cost Slider */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 md:p-6 card-shadow border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <label htmlFor="cost-slider" className="font-body font-bold text-sm text-on-surface">
            {isEducation ? t.courseFeeLabel : t.adjustCostLabel}
          </label>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-fixed/50 text-primary uppercase">
              Category: {userProfile.category?.toUpperCase()}
            </span>
            <span className="font-headline text-xl md:text-2xl font-bold text-primary px-3 py-1 bg-primary/10 rounded-xl">
              {formatFullIndianCurrency(sliderValue)}
            </span>
          </div>
        </div>

        {/* Range Input Slider */}
        <div className="relative pt-2 pb-1">
          <input
            id="cost-slider"
            type="range"
            min={10000}
            max={sliderMax}
            step={10000}
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full h-3 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          />
        </div>

        {/* Milestone Tick Labels */}
        <div className="flex justify-between text-[11px] font-bold text-on-surface-variant px-1 -mt-1">
          <span>₹10k</span>
          <span>₹50k (Micro)</span>
          <span>₹1.4L</span>
          <span>₹5L</span>
          <span>₹20L</span>
          <span>{formatIndianCurrency(sliderMax)}</span>
        </div>

        <p className="font-body text-xs text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs text-secondary shrink-0">info</span>
          <span>{getSliderHelpText()}</span>
        </p>
      </div>

      {/* Fallback Notification Banner */}
      {isFallbackActive && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 animate-fade-in shadow-xs">
          <span
            className="material-symbols-outlined text-amber-700 text-2xl shrink-0 mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            info
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-amber-900">{t.fallbackNoticeTitle}</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded">
                Open to All Categories
              </span>
            </div>
            <p className="font-body text-xs text-amber-800 leading-relaxed">
              {t.fallbackNoticeMsg}
            </p>
          </div>
        </div>
      )}

      {/* Eligibility Notice Banner */}
      {!isGatePassed && (
        <div className="bg-error-container/20 border-2 border-error/40 rounded-2xl p-4 flex items-start gap-3 animate-shake shadow-xs">
          <span
            className="material-symbols-outlined text-error text-2xl shrink-0 mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            report
          </span>
          <div className="space-y-1">
            <span className="font-bold text-sm text-error">{t.gateFailedTitle}</span>
            <p className="font-body text-xs text-on-surface leading-relaxed">
              {language === 'hi' ? gateFailureReasonHi : gateFailureReasonEn}
            </p>
            <p className="font-body text-xs text-primary font-semibold pt-1">
              💡 {t.exploreGeneralOptions}
            </p>
          </div>
        </div>
      )}

      {/* Primary Recommended Scheme Card */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-body font-bold text-primary uppercase tracking-wider">
            Primary Recommended Match
          </span>
          <span className="text-xs font-bold text-secondary">
            {primaryScheme.matchPercentage}% Match
          </span>
        </div>

        <div
          className={`bg-surface-container-lowest rounded-2xl border-2 border-primary card-shadow p-5 md:p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${
            animatePop ? 'animate-pop-glow scale-[1.01]' : ''
          }`}
        >
          {/* Top Banner & Agency */}
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-on-primary">
                  {primaryScheme.agencyShort}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">
                  {primaryScheme.agency}
                </span>
                {primaryScheme.verificationStatus && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    <span>Live 2026</span>
                  </span>
                )}
              </div>
              <h3 className="font-headline text-xl md:text-2xl font-bold text-primary">
                {language === 'hi' ? primaryScheme.nameHi : primaryScheme.nameEn}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-xs text-on-surface-variant block">{t.maxAmount}</span>
              <span className="font-headline text-xl font-bold text-primary">
                Up to {formatIndianCurrency(primaryScheme.maxLoanAmount)}
              </span>
            </div>
          </div>

          {/* Scheme Parameters Grid */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-outline-variant/30 text-center">
            <div className="p-2 bg-surface-container-low rounded-xl">
              <span className="text-[11px] text-on-surface-variant block">{t.interestRate}</span>
              <span className="font-headline text-base md:text-lg font-bold text-primary">
                {userProfile.gender === 'female' && primaryScheme.interestRateWomen
                  ? `${primaryScheme.interestRateWomen}% (Women)`
                  : `${primaryScheme.interestRate}% p.a.`}
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">
                {language === 'hi' ? primaryScheme.interestRateNoteHi : primaryScheme.interestRateNoteEn}
              </span>
            </div>
            <div className="p-2 bg-surface-container-low rounded-xl">
              <span className="text-[11px] text-on-surface-variant block">{t.repayment}</span>
              <span className="font-headline text-base md:text-lg font-bold text-primary">
                {primaryScheme.repaymentYears} Years
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">
                ({primaryScheme.repaymentMonths} months)
              </span>
            </div>
            <div className="p-2 bg-surface-container-low rounded-xl">
              <span className="text-[11px] text-on-surface-variant block">{t.moratorium}</span>
              <span className="font-headline text-base md:text-lg font-bold text-secondary">
                {primaryScheme.moratoriumMonths > 0 ? `${primaryScheme.moratoriumMonths} Months` : 'None'}
              </span>
              <span className="text-[10px] text-on-surface-variant block mt-0.5">
                Repayment holiday
              </span>
            </div>
          </div>

          {/* Reasons for Eligibility */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-on-surface block">{t.eligibleBecause}</span>
            <ul className="space-y-1">
              {(language === 'hi' ? primaryScheme.reasonsHi : primaryScheme.reasonsEn).map((reason, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-secondary-container">check_circle</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Explanation Accordion if triggered */}
          {aiExplanation && (
            <div className="p-3.5 bg-primary-fixed/20 border border-primary/20 rounded-xl space-y-1 animate-pop-glow">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                <span>AI Eligibility Analysis</span>
              </div>
              <p className="font-body text-xs text-on-surface leading-relaxed">
                {aiExplanation}
              </p>
            </div>
          )}

          {/* AI Explanation Error Alert if failed */}
          {aiExplainError && (
            <div className="p-3 bg-error-container text-on-error-container rounded-xl flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{aiExplainError}</span>
              </div>
              <button
                type="button"
                onClick={handleExplainWithAi}
                className="underline font-bold hover:opacity-80 shrink-0 cursor-pointer"
              >
                {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={() => selectSchemeAndNavigateToCalculator(primaryScheme, primaryScheme.maxLoanAmount)}
              className="flex-1 bg-primary text-on-primary font-body font-bold text-sm rounded-xl py-3 px-4 hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[48px]"
            >
              <span>{t.proceedWith} {language === 'hi' ? primaryScheme.nameHi : primaryScheme.nameEn}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>

            <button
              onClick={handleExplainWithAi}
              disabled={isAiExplaining}
              className="sm:w-auto px-4 py-3 bg-surface-container-high text-primary hover:bg-primary-fixed/60 border border-primary/20 font-body font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-secondary">
                {isAiExplaining ? 'progress_activity' : 'auto_awesome'}
              </span>
              <span>{isAiExplaining ? t.aiExplaining : t.aiExplainBtn}</span>
            </button>
          </div>

          <button
            onClick={() => selectSchemeAndNavigateToChecklist(primaryScheme)}
            className="w-full text-center font-body font-bold text-xs text-primary hover:underline pt-1 cursor-pointer"
          >
            📋 View Required Documents for this Scheme →
          </button>
        </div>
      </section>

      {/* Additional Eligible Schemes from Unified Catalog */}
      {allEligibleSchemes.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-body font-bold text-sm text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary">verified</span>
              <span>Other Verified Schemes You Also Qualify For ({allEligibleSchemes.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allEligibleSchemes.slice(0, 4).map((scheme) => (
              <div
                key={scheme.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 card-shadow p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary-fixed text-primary">
                      {scheme.agencyShort}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      Up to {formatIndianCurrency(scheme.maxLoanAmount)}
                    </span>
                  </div>
                  <h4 className="font-headline text-base font-bold text-on-surface">
                    {language === 'hi' ? scheme.nameHi : scheme.nameEn}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Interest: <strong>{scheme.interestRate}% p.a.</strong> • Repayment: {scheme.repaymentYears} yrs
                  </p>
                </div>

                <button
                  onClick={() => selectSchemeAndNavigateToCalculator(scheme, scheme.maxLoanAmount)}
                  className="w-full py-2 bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary font-body font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Calculate EMI</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Near Misses Section */}
      {nearMisses.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="font-body font-bold text-sm text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">visibility</span>
            <span>{t.nearMisses}</span>
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {nearMisses.map((nearScheme) => (
              <div
                key={nearScheme.id}
                className="bg-surface-container-lowest rounded-2xl border border-secondary-fixed-dim card-shadow p-4.5 flex flex-col gap-2.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface">
                        {nearScheme.agencyShort}
                      </span>
                      <h4 className="font-headline text-base md:text-lg font-bold text-on-surface">
                        {language === 'hi' ? nearScheme.nameHi : nearScheme.nameEn}
                      </h4>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      Interest: {nearScheme.interestRate}% p.a. • Max {nearScheme.repaymentYears} Years
                    </span>
                  </div>
                  <span className="font-headline text-base font-bold text-primary">
                    Up to {formatIndianCurrency(nearScheme.maxLoanAmount)}
                  </span>
                </div>

                {/* Gap Box */}
                <div className="flex items-start gap-2 text-secondary bg-surface-container p-2.5 rounded-xl text-xs font-semibold">
                  <span
                    className="material-symbols-outlined text-base shrink-0 mt-0.5 text-secondary-container"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    warning
                  </span>
                  <span>
                    {language === 'hi'
                      ? nearScheme.nearMissGapHi || 'पात्रता शर्तों की पुष्टि करें'
                      : nearScheme.nearMissGapEn || 'Review eligibility conditions'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
