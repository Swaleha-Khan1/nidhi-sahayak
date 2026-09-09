import React, { useState, useEffect, useRef } from 'react';
import { Language, UserProfile, SchemeRecommendation } from '../types';
import { translations } from '../data/translations';
import { evaluateEligibility, formatIndianCurrency, formatFullIndianCurrency } from '../data/schemes';

interface RecommenderScreenProps {
  language: Language;
  profile: UserProfile;
  onUpdateCost: (newCost: number) => void;
  onProceedToCalculator: (scheme: SchemeRecommendation) => void;
  onProceedToChecklist: (scheme: SchemeRecommendation) => void;
}

export const RecommenderScreen: React.FC<RecommenderScreenProps> = ({
  language,
  profile,
  onUpdateCost,
  onProceedToCalculator,
  onProceedToChecklist,
}) => {
  const t = translations[language];
  const [sliderValue, setSliderValue] = useState<number>(profile.projectCost || 120000);
  const [previousSchemeId, setPreviousSchemeId] = useState<string>('');
  const [animatePop, setAnimatePop] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiExplaining, setIsAiExplaining] = useState(false);
  const particlesContainerRef = useRef<HTMLDivElement>(null);

  // Evaluate eligibility using dataset-driven rule engine
  const currentProfile: UserProfile = { ...profile, projectCost: sliderValue };
  const {
    isGatePassed,
    gateFailureReasonEn,
    gateFailureReasonHi,
    isFallbackActive,
    primaryScheme,
    allEligibleSchemes,
    nearMisses,
  } = evaluateEligibility(currentProfile);

  const isEducation = profile.purpose === 'education';
  const sliderMax = isEducation ? (profile.educationLocation === 'abroad' ? 4000000 : 3000000) : 5000000;

  // Keep sliderValue synchronized whenever profile changes from intake or chat extraction
  useEffect(() => {
    if (typeof profile.projectCost === 'number') {
      setSliderValue(profile.projectCost);
      setAiExplanation(null);
    }
  }, [profile.projectCost, profile.purpose, profile.educationLocation]);

  // Trigger pop glow animation & particles when scheme changes dynamically across threshold
  useEffect(() => {
    if (previousSchemeId && previousSchemeId !== primaryScheme.id) {
      setAnimatePop(true);
      createParticles();
      const timer = setTimeout(() => setAnimatePop(false), 600);
      return () => clearTimeout(timer);
    }
    setPreviousSchemeId(primaryScheme.id);
  }, [primaryScheme.id]);

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
    onUpdateCost(val);
    setAiExplanation(null);
  };

  // Helper text under slider based on cost threshold
  const getSliderHelpText = () => {
    if (isEducation) {
      const isAbroad = profile.educationLocation === 'abroad';
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
    setIsAiExplaining(true);
    setAiExplanation(null);
    try {
      const response = await fetch('/api/ai/explain-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeName: language === 'hi' ? primaryScheme.nameHi : primaryScheme.nameEn,
          agency: primaryScheme.agency,
          projectCost: sliderValue,
          annualIncome: profile.annualIncome,
          userCategory: profile.category.toUpperCase(),
          language,
          category: primaryScheme.category,
        }),
      });
      const data = await response.json();
      setAiExplanation(data.explanation);
    } catch (err) {
      console.error(err);
      setAiExplanation(
        language === 'hi'
          ? `यह योजना आपकी ₹${sliderValue.toLocaleString('en-IN')} की लागत हेतु सर्वश्रेष्ठ है। इसमें रियायती ब्याज दर और मोरेटोरियम अवधि दी गई है।`
          : `This scheme is well-matched for your ₹${sliderValue.toLocaleString('en-IN')} requirement with concessional interest and initial moratorium benefits.`
      );
    } finally {
      setIsAiExplaining(false);
    }
  };

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-6">
      {/* Header */}
      <section>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary">
            {t.matchesTitle}
          </h2>
          <span className="text-xs font-bold px-3 py-1 bg-surface-container-high text-on-surface rounded-full border border-outline-variant/30">
            Category: <strong className="text-primary uppercase">{profile.category}</strong>
            {profile.specialOccupation && profile.specialOccupation !== 'none' && ` • ${profile.specialOccupation.replace('_', ' ')}`}
          </span>
        </div>
        <p className="font-body text-sm text-on-surface-variant">
          {t.matchesSubtitle}
        </p>
      </section>

      {/* Fallback Notice (Shown if user's category has zero specific schemes or requires open schemes) */}
      {isFallbackActive && (
        <div className="bg-amber-50/90 border-l-4 border-amber-500 p-4 rounded-xl flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <span className="material-symbols-outlined text-xl text-amber-600">info</span>
            <span>{t.fallbackNoticeTitle}</span>
          </div>
          <p className="font-body text-xs md:text-sm text-amber-950 leading-relaxed">
            {language === 'hi' ? t.fallbackNoticeMsg : t.fallbackNoticeMsg}
          </p>
        </div>
      )}

      {/* Income Gate Failure Alert (If Income exceeds scheme threshold) */}
      {!isGatePassed && (
        <div className="bg-error-container/40 border-l-4 border-error p-4 rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-error font-bold text-sm">
            <span className="material-symbols-outlined text-xl">warning</span>
            <span>{t.gateFailedTitle}</span>
          </div>
          <p className="font-body text-xs md:text-sm text-on-surface">
            {language === 'hi' ? gateFailureReasonHi : gateFailureReasonEn}
          </p>
          <div className="pt-1 text-xs text-on-surface-variant font-semibold">
            {t.exploreGeneralOptions}
          </div>
        </div>
      )}

      {/* What-If Slider (Interactive Real-Time Rule Switching) */}
      <section className="bg-surface-container-lowest p-5 rounded-2xl floating-shadow border border-surface-variant relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary-container to-secondary" />
        
        <div className="flex justify-between items-center mb-3">
          <label htmlFor="project-cost-slider" className="font-body font-bold text-sm text-on-surface">
            {isEducation ? t.courseFeeLabel : t.adjustCostLabel}
          </label>
          <span className="font-body text-xs font-semibold text-secondary bg-secondary-fixed/50 px-2.5 py-1 rounded-full">
            National What-If Engine
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-headline text-2xl md:text-3xl font-bold text-primary tracking-tight">
              {formatFullIndianCurrency(sliderValue)}
            </span>
            <span className="font-body text-xs text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-full font-semibold">
              {formatIndianCurrency(sliderValue)}
            </span>
          </div>

          <div className="relative pt-1 pb-6">
            <input
              id="project-cost-slider"
              type="range"
              min="0"
              max={sliderMax}
              step="10000"
              value={sliderValue}
              onChange={handleSliderChange}
              className="custom-range-slider"
              style={{
                background: `linear-gradient(to right, #ff8f00 0%, #ff8f00 ${(sliderValue / sliderMax) * 100}%, #e3e2e1 ${(sliderValue / sliderMax) * 100}%, #e3e2e1 100%)`,
              }}
            />
            <div className="flex justify-between mt-2 absolute w-full px-1 text-xs text-on-surface-variant font-semibold">
              <span>₹0</span>
              {isEducation ? (
                <>
                  <span className="text-secondary font-bold">
                    {profile.educationLocation === 'abroad' ? '₹20 Lakh' : '₹15 Lakh'}
                  </span>
                  <span>{profile.educationLocation === 'abroad' ? '₹40 Lakh (Cap)' : '₹30 Lakh (Cap)'}</span>
                </>
              ) : (
                <>
                  <span className="text-secondary font-bold">₹1.4L (Micro Threshold)</span>
                  <span>₹50 Lakh</span>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="font-body text-xs text-on-surface-variant mt-1 italic flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">info</span>
          <span>{getSliderHelpText()}</span>
        </p>
      </section>

      {/* Dynamic Recommendation Card (Pops & Glows on threshold crossing) */}
      <section
        className={`bg-surface-container-lowest rounded-2xl card-shadow border-l-4 border-l-tertiary-container relative overflow-hidden transition-all duration-300 ${
          animatePop ? 'animate-pop-glow' : ''
        }`}
      >
        <div className="p-5 md:p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              {/* Agency Tag & Match Badge with Particle emitter anchor */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <div className="relative inline-block">
                  <div
                    ref={particlesContainerRef}
                    className="absolute inset-0 pointer-events-none"
                  />
                  <div className="inline-flex items-center gap-1.5 bg-tertiary-fixed-dim text-on-tertiary-container px-3 py-1 rounded-full font-body font-bold text-xs shadow-xs">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <span>{primaryScheme.matchPercentage}% Match</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-fixed text-primary border border-primary/20">
                  {primaryScheme.agencyShort}
                </span>

                {primaryScheme.isCategoryFallback && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Open National Scheme
                  </span>
                )}
              </div>

              <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface">
                {language === 'hi' ? primaryScheme.nameHi : primaryScheme.nameEn}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                {primaryScheme.agency}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="block font-body text-xs text-on-surface-variant font-medium">
                {t.maxAmount}
              </span>
              <span className="font-headline text-2xl md:text-3xl font-bold text-primary">
                {formatIndianCurrency(primaryScheme.maxLoanAmount)}
              </span>
            </div>
          </div>

          {/* Eligibility reasons based on dataset */}
          <div className="bg-surface-container-low rounded-xl p-3.5 space-y-2">
            <p className="font-body font-bold text-xs text-on-surface uppercase tracking-wider">
              {t.eligibleBecause}
            </p>
            <ul className="flex flex-col gap-1.5">
              {(language === 'hi' ? primaryScheme.reasonsHi : primaryScheme.reasonsEn).map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-tertiary-container text-base shrink-0 mt-0.5">
                    check
                  </span>
                  <span className="font-body text-xs md:text-sm text-on-surface-variant">
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Scheme Parameters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 border-t border-surface-variant pt-3.5">
            <div>
              <span className="block font-body text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">percent</span> {t.interestRate}
              </span>
              <span className="font-body font-bold text-sm md:text-base text-on-surface">
                {primaryScheme.interestRate}% p.a.
              </span>
              <span className="block text-[11px] text-on-surface-variant">
                {language === 'hi' ? primaryScheme.interestRateNoteHi : primaryScheme.interestRateNoteEn}
              </span>
            </div>

            <div>
              <span className="block font-body text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">calendar_month</span> {t.repayment}
              </span>
              <span className="font-body font-bold text-sm md:text-base text-on-surface">
                Max {primaryScheme.repaymentYears} Years
              </span>
              <span className="block text-[11px] text-on-surface-variant">
                ({primaryScheme.repaymentMonths} monthly installments)
              </span>
            </div>

            <div className="col-span-2 md:col-span-1">
              <span className="block font-body text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">timer</span> {t.moratorium}
              </span>
              <span className="font-body font-bold text-sm md:text-base text-on-surface">
                {primaryScheme.moratoriumMonths} Months Moratorium
              </span>
              <span className="block text-[11px] text-on-surface-variant">
                Repayment holiday period
              </span>
            </div>
          </div>

          {/* Application Route Info */}
          {primaryScheme.applicationRoute && (
            <div className="p-3 bg-surface-container rounded-xl text-xs flex items-start gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">how_to_reg</span>
              <div>
                <strong className="text-on-surface">Application Channel:</strong> {primaryScheme.applicationRoute}
                {primaryScheme.officialSourceLink && (
                  <div className="mt-1">
                    <a
                      href={primaryScheme.officialSourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                    >
                      Official Scheme Portal <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Explanation Accordion/Card */}
          {aiExplanation && (
            <div className="bg-primary-fixed/30 border border-primary/20 rounded-xl p-3.5 text-xs md:text-sm text-on-surface leading-relaxed animate-pop-glow space-y-1.5">
              <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span>AI Guidance for {primaryScheme.agencyShort} Applicant</span>
              </div>
              <p>{aiExplanation}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={() => onProceedToCalculator(primaryScheme)}
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
            onClick={() => onProceedToChecklist(primaryScheme)}
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
                  onClick={() => onProceedToCalculator(scheme)}
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
