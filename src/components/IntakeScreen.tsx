import React, { useState } from 'react';
import { parseSituation } from '../lib/geminiClient';
import { BeneficiaryCategory, SpecialOccupation, PurposeType, UserProfile } from '../types';
import { translations } from '../data/translations';
import { evaluateEligibility } from '../data/schemes';
import { SAMPLE_CITIES } from '../data/partners';
import { useApp } from '../context/AppContext';

interface IntakeScreenProps {
  language?: 'en' | 'hi';
  profile?: UserProfile;
  onUpdateProfile?: (profile: UserProfile) => void;
  onProceedToRecommender?: () => void;
  initialMode?: 'form' | 'chat';
}

export const IntakeScreen: React.FC<IntakeScreenProps> = ({
  initialMode = 'form',
  onProceedToRecommender,
}) => {
  const {
    language,
    userProfile,
    setUserProfile,
    updateUserProfile,
    setActiveTab,
    intakeInitialMode,
  } = useApp();

  const t = translations[language];
  const [mode, setMode] = useState<'form' | 'chat'>(intakeInitialMode || initialMode);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [chatErrorMessage, setChatErrorMessage] = useState<string | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<UserProfile | null>(null);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  const handleFormChange = (field: keyof UserProfile, value: any) => {
    setFormValidationError(null);
    updateUserProfile({
      [field]: value,
    });
  };

  const handleFormSubmit = () => {
    if (!userProfile.purpose || !userProfile.category || !userProfile.projectCost || userProfile.projectCost <= 0) {
      setFormValidationError(t.fillAllFieldsPrompt);
      return;
    }
    setFormValidationError(null);
    if (onProceedToRecommender) {
      onProceedToRecommender();
    } else {
      setActiveTab('schemes');
    }
  };

  const handleSendChat = async (textToSend?: string) => {
    const prompt = textToSend !== undefined ? textToSend : chatInput;
    if (!prompt.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiMessage(null);
    setChatErrorMessage(null);
    setExtractedPreview(null);
    try{
    const data = await parseSituation(prompt, language);

      // Check if the input was deemed not confident or garbage
      if (data.isConfident === false || data.errorMessageEn) {
        setChatErrorMessage(
          language === 'hi'
            ? (data.errorMessageHi || t.couldNotUnderstand)
            : (data.errorMessageEn || t.couldNotUnderstand)
        );
        setExtractedPreview(null);
        return;
      }

      const validPurposes: PurposeType[] = ['business', 'education', 'agriculture', 'sanitation', 'services', 'other'];
      const parsedPurpose = validPurposes.includes(data.purpose) ? data.purpose : null;

      const validCategories: BeneficiaryCategory[] = ['sc', 'st', 'obc', 'ews', 'general', 'minority', 'pwd'];
      const parsedCategory: BeneficiaryCategory | null = validCategories.includes(data.category) ? data.category : null;

      const validOccupations: SpecialOccupation[] = ['none', 'street_vendor', 'artisan', 'safai_karamchari', 'weaver'];
      const parsedOccupation: SpecialOccupation = validOccupations.includes(data.specialOccupation) ? data.specialOccupation : 'none';

      const cost = typeof data.projectCost === 'number' && data.projectCost > 0 ? data.projectCost : null;
      const income = typeof data.annualIncome === 'number' && data.annualIncome >= 0 ? data.annualIncome : null;

      // If neither purpose nor cost nor category was extracted, show could not understand
      if (!parsedPurpose && !cost && !parsedCategory) {
        setChatErrorMessage(t.couldNotUnderstand);
        setExtractedPreview(null);
        return;
      }

      // Extract location if present
      let parsedCity: string = '';
      if (typeof data.city === 'string' && data.city.trim()) {
        parsedCity = data.city.trim();
      } else {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('bhopal') || lowerPrompt.includes('भोपाल')) parsedCity = 'Bhopal';
        else if (lowerPrompt.includes('delhi') || lowerPrompt.includes('दिल्ली')) parsedCity = 'Delhi';
        else if (lowerPrompt.includes('mumbai') || lowerPrompt.includes('मुंबई')) parsedCity = 'Mumbai';
        else if (lowerPrompt.includes('lucknow') || lowerPrompt.includes('लखनऊ')) parsedCity = 'Lucknow';
        else if (lowerPrompt.includes('bengaluru') || lowerPrompt.includes('bangalore')) parsedCity = 'Bengaluru';
        else if (lowerPrompt.includes('jaipur') || lowerPrompt.includes('जयपुर')) parsedCity = 'Jaipur';
        else if (lowerPrompt.includes('patna') || lowerPrompt.includes('पटना')) parsedCity = 'Patna';
        else if (lowerPrompt.includes('kolkata') || lowerPrompt.includes('कोलकाता')) parsedCity = 'Kolkata';
      }

      const newPreview: UserProfile = {
        purpose: parsedPurpose,
        projectCost: cost,
        annualIncome: income,
        category: parsedCategory,
        specialOccupation: parsedOccupation,
        isPwd: Boolean(data.isPwd || parsedCategory === 'pwd'),
        gender: data.gender === 'female' || data.gender === 'other' ? data.gender : 'male',
        educationLocation: data.educationLocation === 'abroad' ? 'abroad' : 'india',
        city: parsedCity || userProfile.city || '',
      };

      setExtractedPreview(newPreview);
      setAiMessage(language === 'hi' ? data.explanationHi : data.explanationEn);
    } catch (err: any) {
      console.error('Chat error:', err);
      // Remove any silent fallback-to-default-values behavior:
      // Show explicit error state instead of guessing defaults
      setChatErrorMessage(
        err.message?.includes('AI_SERVICE_ERROR') || err.message?.includes('temporarily') || err.message?.includes('Failed to parse')
          ? (language === 'hi'
              ? 'एआई पार्सिंग सेवा से संपर्क करने में समस्या हुई। कोई स्वचालित डिफ़ॉल्ट लागू नहीं किया गया है। कृपया विवरण दर्ज करने हेतु मैन्युअल फ़ॉर्म का उपयोग करें।'
              : 'AI parsing service temporarily unavailable. No silent defaults applied. Please use the Manual Form tab to enter your parameters directly.')
          : (language === 'hi'
              ? (err.message || 'एआई सेवा अनुपलब्ध है। कृपया मैन्युअल फ़ॉर्म का उपयोग करें।')
              : (err.message || 'AI service unavailable. Please use the Manual Form.'))
      );
      setExtractedPreview(null);
    } finally {
      setIsAiLoading(false);
    }
  };

  const sampleChips = [
    { label: t.chip1, text: 'I am an OBC woman from Bhopal. I want to start a tailoring business and need ₹1.5 lakh. Family income is ₹1.8 lakh per annum.' },
    { label: t.chip2, text: 'I am an ST student. I need an education loan of ₹15 lakh for B.Tech in India. Family income is ₹2.5 lakh.' },
    { label: t.chip3, text: 'I am a street food vendor in Delhi needing ₹20,000 working capital loan under PM SVANidhi.' },
    { label: t.chip4, text: 'I am a traditional artisan carpenter looking for modern toolkit and ₹2 Lakh credit under PM Vishwakarma.' },
  ];

  const categoryOptions: { key: BeneficiaryCategory; label: string }[] = [
    { key: 'sc', label: t.categorySC },
    { key: 'st', label: t.categoryST },
    { key: 'obc', label: t.categoryOBC },
    { key: 'minority', label: t.categoryMinority },
    { key: 'pwd', label: t.categoryPwD },
    { key: 'ews', label: t.categoryEWS },
    { key: 'general', label: t.categoryGeneral },
  ];

  const occupationOptions: { key: SpecialOccupation; label: string }[] = [
    { key: 'none', label: t.occupationNone },
    { key: 'street_vendor', label: t.occupationVendor },
    { key: 'artisan', label: t.occupationArtisan },
    { key: 'safai_karamchari', label: t.occupationSanitation },
    { key: 'weaver', label: t.occupationWeaver },
  ];

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-5">
      {/* Progress Indicator */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-body font-bold text-sm text-primary">{t.step1Of2}</span>
          <span className="font-body text-xs text-on-surface-variant">{t.profileSetup}</span>
        </div>
        <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
          <div
            className="bg-secondary-container h-2 rounded-full transition-all duration-300"
            style={{ width: '50%' }}
          />
        </div>
      </div>

      {/* Mode Toggle (Form Mode vs Chat Mode) */}
      <div className="flex bg-surface-container-low rounded-xl p-1 shadow-xs border border-outline-variant/30">
        <button
          onClick={() => {
            setMode('form');
            setFormValidationError(null);
          }}
          className={`flex-1 py-2.5 text-center font-body font-bold text-sm rounded-lg transition-all cursor-pointer ${
            mode === 'form'
              ? 'bg-surface-container-lowest shadow-xs text-primary'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60'
          }`}
        >
          {t.formMode}
        </button>
        <button
          onClick={() => {
            setMode('chat');
            setFormValidationError(null);
          }}
          className={`flex-1 py-2.5 text-center font-body font-bold text-sm rounded-lg transition-all cursor-pointer ${
            mode === 'chat'
              ? 'bg-surface-container-lowest shadow-xs text-secondary font-bold'
              : 'text-on-surface-variant hover:text-secondary hover:bg-surface-container/60'
          }`}
        >
          {t.chatMode}
        </button>
      </div>

      {/* View Container */}
      {mode === 'form' ? (
        /* MODE A: Structured Form */
        <div className="bg-surface-container-lowest rounded-2xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,6,102,0.08)] border border-outline-variant/25 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-headline text-xl font-bold text-primary">
              {t.tellUsNeeds}
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-primary-fixed/40 text-primary rounded-full border border-primary/20">
              {userProfile.purpose === 'education' ? '🎓 Education Track' : '💼 Business & Trade Track'}
            </span>
          </div>

          {formValidationError && (
            <div className="bg-error-container/20 border border-error/40 p-3 rounded-xl flex items-center gap-2 text-error text-xs font-bold animate-shake">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{formValidationError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Purpose */}
            <div>
              <label className="block font-body font-bold text-sm text-on-surface mb-1.5">
                {t.purposeLabel} <span className="text-error">*</span>
              </label>
              <select
                value={userProfile.purpose || ''}
                onChange={(e) => handleFormChange('purpose', e.target.value as PurposeType || null)}
                className="w-full min-h-[48px] rounded-xl border border-primary/20 bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-on-surface p-3 outline-none transition-all font-medium"
              >
                <option value="">{language === 'hi' ? '-- उद्देश्य चुनें --' : '-- Select Purpose --'}</option>
                <option value="business">{t.purposeBusiness}</option>
                <option value="education">{t.purposeEducation}</option>
                <option value="agriculture">{t.purposeAgriculture}</option>
                <option value="sanitation">{t.purposeSanitation}</option>
                <option value="services">{t.purposeServices}</option>
                <option value="other">{language === 'hi' ? 'अन्य उद्देश्य' : 'Other Purpose'}</option>
              </select>
            </div>

            {/* If Education: India or Abroad */}
            {userProfile.purpose === 'education' && (
              <div className="p-3.5 bg-primary-fixed/30 rounded-xl border border-primary/20 space-y-3">
                <label className="block font-body font-bold text-xs text-primary uppercase tracking-wider">
                  {t.educationLocationLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center min-h-[44px] px-3.5 rounded-lg border border-primary/20 bg-surface-bright cursor-pointer hover:bg-surface-container-low text-xs font-semibold">
                    <input
                      type="radio"
                      name="eduLocation"
                      value="india"
                      checked={userProfile.educationLocation !== 'abroad'}
                      onChange={() => handleFormChange('educationLocation', 'india')}
                      className="text-primary focus:ring-primary mr-2.5"
                    />
                    <span>{t.studyIndia}</span>
                  </label>
                  <label className="flex items-center min-h-[44px] px-3.5 rounded-lg border border-primary/20 bg-surface-bright cursor-pointer hover:bg-surface-container-low text-xs font-semibold">
                    <input
                      type="radio"
                      name="eduLocation"
                      value="abroad"
                      checked={userProfile.educationLocation === 'abroad'}
                      onChange={() => handleFormChange('educationLocation', 'abroad')}
                      className="text-primary focus:ring-primary mr-2.5"
                    />
                    <span>{t.studyAbroad}</span>
                  </label>
                </div>
              </div>
            )}

            {/* Required Amount / Estimated Cost */}
            <div>
              <label className="block font-body font-bold text-sm text-on-surface mb-1.5">
                {userProfile.purpose === 'education'
                  ? (language === 'hi' ? 'पाठ्यक्रम शुल्क (₹) / Course Fee' : 'Course Fee (₹)')
                  : t.estimatedCostLabel} <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-bold text-base">₹</span>
                <input
                  type="number"
                  value={userProfile.projectCost ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
                    handleFormChange('projectCost', val);
                  }}
                  placeholder="e.g. 150000"
                  className="w-full min-h-[48px] pl-8 pr-3.5 rounded-xl border border-primary/20 bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-on-surface font-semibold outline-none transition-all"
                />
              </div>
              <p className="mt-1 font-body text-xs text-on-surface-variant">
                {t.estimatedCostHelp}
              </p>
            </div>

            {/* Annual Income */}
            <div>
              <label className="block font-body font-bold text-sm text-on-surface mb-1.5">
                {t.annualIncomeLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-bold text-base">₹</span>
                <input
                  type="number"
                  value={userProfile.annualIncome ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0);
                    handleFormChange('annualIncome', val);
                  }}
                  placeholder="e.g. 200000"
                  className="w-full min-h-[48px] pl-8 pr-3.5 rounded-xl border border-primary/20 bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-on-surface font-semibold outline-none transition-all"
                />
              </div>
              <p className="mt-1 font-body text-xs text-on-surface-variant">
                {t.annualIncomeHelp}
              </p>
            </div>

            {/* Social Category (Single-Select Mandatory Field) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-body font-bold text-sm text-on-surface">
                  {t.categoryLabel} <span className="text-error">*</span>
                </label>
                <span className="text-[11px] font-semibold text-secondary-container">Hard filter</span>
              </div>
              <select
                value={userProfile.category || ''}
                onChange={(e) => handleFormChange('category', (e.target.value as BeneficiaryCategory) || null)}
                className="w-full min-h-[48px] rounded-xl border border-primary/30 bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-on-surface font-semibold p-3 outline-none transition-all"
              >
                <option value="">{language === 'hi' ? '-- अपनी श्रेणी चुनें --' : '-- Select Beneficiary Category --'}</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Layered Secondary Filter 1: Special Occupation / Trade */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-body font-bold text-sm text-on-surface">
                  {t.specialOccupationLabel}
                </label>
                <span className="text-[11px] font-semibold text-on-surface-variant">Layered qualification</span>
              </div>
              <select
                value={userProfile.specialOccupation || 'none'}
                onChange={(e) => handleFormChange('specialOccupation', e.target.value as SpecialOccupation)}
                className="w-full min-h-[48px] rounded-xl border border-outline-variant/40 bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-on-surface p-3 outline-none transition-all"
              >
                {occupationOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Layered Secondary Filter 2: Disability Status (if category not already PwD) */}
            {userProfile.category !== 'pwd' && (
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <div>
                  <span className="font-body font-bold text-xs text-on-surface block">
                    {t.pwdLabel}
                  </span>
                  <span className="font-body text-[11px] text-on-surface-variant">
                    Enables NDFDC concessional interest and additional rebates
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleFormChange('isPwd', true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userProfile.isPwd
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-bright border border-outline-variant/50 text-on-surface'
                    }`}
                  >
                    {language === 'hi' ? 'हाँ' : 'Yes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormChange('isPwd', false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !userProfile.isPwd
                        ? 'bg-surface-container-high text-on-surface'
                        : 'bg-surface-bright border border-outline-variant/50 text-on-surface'
                    }`}
                  >
                    {language === 'hi' ? 'नहीं' : 'No'}
                  </button>
                </div>
              </div>
            )}

            {/* Gender / Concessions */}
            <div>
              <label className="block font-body font-bold text-sm text-on-surface mb-1.5">
                {t.genderLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleFormChange('gender', g)}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      userProfile.gender === g
                        ? 'border-primary bg-primary text-on-primary font-bold shadow-xs'
                        : 'border-outline-variant/40 bg-surface-bright hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    {g === 'female' ? t.female : g === 'male' ? t.male : t.other}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Input: City / District for Channel Partner Locator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-body font-bold text-sm text-on-surface">
                  {t.locationLabel}
                </label>
                <span className="text-[11px] font-semibold text-secondary">
                  {language === 'hi' ? 'आवेदन केंद्र हेतु' : 'Partner Locator'}
                </span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary text-lg">
                  location_on
                </span>
                <input
                  type="text"
                  list="city-datalist-intake"
                  value={userProfile.city || ''}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  placeholder={t.locationPlaceholder}
                  className="w-full min-h-[48px] pl-10 pr-3.5 rounded-xl border border-primary/20 bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-on-surface font-semibold outline-none transition-all"
                />
                <datalist id="city-datalist-intake">
                  {SAMPLE_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Quick 1-click preset city chips */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                <span className="text-[11px] text-on-surface-variant font-medium mr-0.5">
                  {language === 'hi' ? 'त्वरित चयन:' : 'Quick Select:'}
                </span>
                {['Delhi', 'Bhopal', 'Mumbai', 'Lucknow'].map((cityOption) => (
                  <button
                    key={cityOption}
                    type="button"
                    onClick={() => handleFormChange('city', cityOption)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      userProfile.city?.toLowerCase() === cityOption.toLowerCase()
                        ? 'border-primary bg-primary text-on-primary shadow-xs'
                        : 'border-outline-variant/40 bg-surface-bright hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    📍 {cityOption}
                  </button>
                ))}
                {userProfile.city && (
                  <button
                    type="button"
                    onClick={() => handleFormChange('city', '')}
                    className="text-[11px] text-error hover:underline ml-auto cursor-pointer font-semibold"
                  >
                    ✕ {t.clearLocation}
                  </button>
                )}
              </div>
              <p className="mt-1 font-body text-xs text-on-surface-variant">
                {t.locationHelp}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleFormSubmit}
              className="w-full mt-2 bg-primary text-on-primary font-body font-bold text-base rounded-xl min-h-[54px] shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.continueBtn}</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          </div>
        </div>
      ) : (
        /* MODE B: Conversational / Chat Assistant */
        <div className="bg-surface-container-lowest rounded-2xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,6,102,0.08)] border border-secondary/20 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className="material-symbols-outlined text-secondary-container text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              chat
            </span>
            <h2 className="font-headline text-xl font-bold text-primary">
              {t.letsChatTitle}
            </h2>
          </div>

          {/* Prompt Chips */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-body text-on-surface-variant font-semibold">Try asking:</span>
            <div className="flex flex-wrap gap-2">
              {sampleChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatInput(chip.text);
                    handleSendChat(chip.text);
                  }}
                  className="bg-surface-container-low border border-outline-variant/40 text-on-surface-variant text-xs px-3 py-1.5 rounded-full hover:bg-surface-container hover:text-primary transition-all text-left active:scale-95 cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator Card while Gemini parses */}
          {isAiLoading && (
            <div className="bg-surface-container-low rounded-xl p-4 border border-secondary/30 flex flex-col gap-2.5 animate-pulse shadow-xs">
              <div className="flex items-center gap-2 text-secondary font-bold text-xs">
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                <span>{t.aiAnalyzing}</span>
              </div>
              <p className="font-body text-xs text-on-surface-variant">
                {t.extractingSub}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <div className="h-10 bg-surface-container rounded-lg animate-pulse" />
                <div className="h-10 bg-surface-container rounded-lg animate-pulse" />
                <div className="h-10 bg-surface-container rounded-lg animate-pulse col-span-2 sm:col-span-1" />
              </div>
            </div>
          )}

          {/* Chat Error Message (e.g. for nonsensical, unparseable input, or API error) */}
          {!isAiLoading && chatErrorMessage && (
            <div className="bg-error-container/15 border-2 border-error/30 rounded-xl p-4 flex items-start gap-3 animate-fade-in shadow-xs">
              <span className="material-symbols-outlined text-error text-2xl shrink-0 mt-0.5">error_outline</span>
              <div className="space-y-2 flex-1">
                <div>
                  <p className="font-bold text-sm text-error">
                    {language === 'hi' ? 'सूचना / त्रुटि' : 'Notice / Error'}
                  </p>
                  <p className="font-body text-xs text-on-surface leading-relaxed mt-0.5">
                    {chatErrorMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('form')}
                  className="px-3 py-1.5 bg-surface-container-highest hover:bg-primary hover:text-on-primary text-primary text-xs font-bold rounded-lg border border-outline-variant transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  <span>{language === 'hi' ? 'मैन्युअल फॉर्म पर जाएँ' : 'Switch to Manual Form'}</span>
                </button>
              </div>
            </div>
          )}

          {/* AI Response & Extracted Details Card */}
          {!isAiLoading && extractedPreview && (() => {
            const isEdu = extractedPreview.purpose === 'education';
            const costLabel = isEdu
              ? (language === 'hi' ? 'पाठ्यक्रम शुल्क (Course Fee)' : 'Course Fee')
              : (language === 'hi' ? 'परियोजना लागत (Project Cost)' : 'Project Cost');

            const purposeDisplay = extractedPreview.purpose ? ({
              education: language === 'hi' ? '🎓 शिक्षा (Education)' : '🎓 Education',
              business: language === 'hi' ? '💼 व्यवसाय (Business)' : '💼 Business',
              agriculture: language === 'hi' ? '🚜 कृषि (Agriculture)' : '🚜 Agriculture',
              sanitation: language === 'hi' ? '🧹 स्वच्छता (Sanitation)' : '🧹 Sanitation',
              services: language === 'hi' ? '🚗 सेवा / परिवहन (Services)' : '🚗 Services',
              other: language === 'hi' ? '📋 अन्य (Other)' : '📋 Other',
            }[extractedPreview.purpose] || extractedPreview.purpose) : (
              language === 'hi' ? 'अनिर्धारित उद्देश्य' : 'Unset Purpose'
            );

            const occupationDisplay = {
              none: '',
              street_vendor: '🛒 PM SVANidhi Vendor',
              artisan: '🔨 PM Vishwakarma Artisan',
              safai_karamchari: '🧹 NSKFDC Sanitation',
              weaver: '🧵 Weaver MUDRA',
            }[extractedPreview.specialOccupation || 'none'];

            // Only run eligibility evaluation if category, purpose, and cost are present
            const isReadyForEvaluation = Boolean(
              extractedPreview.category &&
              extractedPreview.purpose &&
              extractedPreview.projectCost &&
              extractedPreview.projectCost > 0
            );

            const evalResult = isReadyForEvaluation
              ? evaluateEligibility(extractedPreview)
              : null;

            return (
              <div className="bg-surface-container-low rounded-xl p-4 border border-secondary/30 flex flex-col gap-3 animate-pop-glow shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-secondary font-bold text-xs">
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    <span>{t.extractedDetails}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary-fixed text-secondary">
                      {purposeDisplay}
                    </span>
                    {occupationDisplay && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-fixed/50 text-primary">
                        {occupationDisplay}
                      </span>
                    )}
                  </div>
                </div>

                {aiMessage && (
                  <p className="font-body text-sm text-on-surface leading-relaxed">
                    {aiMessage}
                  </p>
                )}

                {/* Missing Category Warning & Explicit Selection */}
                {!extractedPreview.category && (
                  <div className="p-3.5 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <span className="material-symbols-outlined text-base">warning</span>
                      <span>{t.confirmCategoryPrompt}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {categoryOptions.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setExtractedPreview({
                              ...extractedPreview,
                              category: opt.key,
                            });
                          }}
                          className="px-2.5 py-2 rounded-lg bg-surface-bright border border-amber-500/30 hover:bg-amber-100/50 text-xs font-bold text-on-surface transition-all text-center cursor-pointer active:scale-95"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-outline-variant/30 text-xs">
                  <div className="bg-surface-bright p-2.5 rounded-lg border border-outline-variant/30">
                    <span className="text-on-surface-variant block font-medium text-[11px]">{costLabel}:</span>
                    <span className="font-bold text-primary text-sm">
                      {extractedPreview.projectCost
                        ? `₹${extractedPreview.projectCost.toLocaleString('en-IN')}`
                        : (language === 'hi' ? 'अनिर्धारित' : 'Not specified')}
                    </span>
                  </div>
                  <div className="bg-surface-bright p-2.5 rounded-lg border border-outline-variant/30">
                    <span className="text-on-surface-variant block font-medium text-[11px]">
                      {language === 'hi' ? 'वार्षिक आय:' : 'Annual Income:'}
                    </span>
                    <span className="font-bold text-primary text-sm">
                      {extractedPreview.annualIncome !== null && extractedPreview.annualIncome !== undefined
                        ? `₹${extractedPreview.annualIncome.toLocaleString('en-IN')}`
                        : (language === 'hi' ? 'उल्लेखित नहीं' : 'Not specified')}
                    </span>
                  </div>
                  <div className="bg-surface-bright p-2.5 rounded-lg border border-outline-variant/30">
                    <span className="text-on-surface-variant block font-medium text-[11px]">
                      {language === 'hi' ? 'श्रेणी (Category):' : 'Social Category:'}
                    </span>
                    <span className="font-bold text-tertiary-container text-sm uppercase">
                      {extractedPreview.category || (
                        <span className="text-amber-700 font-semibold text-xs lowercase">
                          {language === 'hi' ? 'पुष्टि आवश्यक' : 'pending choice'}
                        </span>
                      )}
                    </span>
                  </div>
                  {isEdu && (
                    <div className="bg-surface-bright p-2.5 rounded-lg border border-outline-variant/30 col-span-2 sm:col-span-3">
                      <span className="text-on-surface-variant block font-medium text-[11px]">
                        {language === 'hi' ? 'अध्ययन स्थान:' : 'Study Location:'}
                      </span>
                      <span className="font-bold text-primary">
                        {extractedPreview.educationLocation === 'abroad'
                          ? (language === 'hi' ? 'विदेश (Abroad)' : 'Abroad')
                          : (language === 'hi' ? 'भारत (India)' : 'India')}
                      </span>
                    </div>
                  )}
                  {extractedPreview.city && (
                    <div className="bg-surface-bright p-2.5 rounded-lg border border-outline-variant/30 col-span-2 sm:col-span-3 flex items-center justify-between">
                      <span className="text-on-surface-variant block font-medium text-[11px]">
                        {language === 'hi' ? 'शहर / ज़िला:' : 'City / District:'}
                      </span>
                      <span className="font-bold text-primary text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                        {extractedPreview.city}
                      </span>
                    </div>
                  )}
                </div>

                {/* Target scheme route badge - ONLY if category and cost are ready */}
                {evalResult && evalResult.primaryScheme && (
                  <div className="flex items-center justify-between p-2.5 bg-primary-fixed/30 rounded-lg border border-primary/20 text-xs flex-wrap gap-2">
                    <span className="text-on-surface-variant font-semibold">{t.schemeRouting}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-bright text-primary border border-primary/20">
                        {evalResult.primaryScheme.agencyShort}
                      </span>
                      <span className="font-bold text-primary">
                        {language === 'hi' ? evalResult.primaryScheme.nameHi : evalResult.primaryScheme.nameEn}
                      </span>
                    </div>
                  </div>
                )}

                {evalResult && evalResult.isFallbackActive && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-md border border-amber-200">
                    ℹ️ {t.fallbackNoticeMsg}
                  </p>
                )}

                <button
                  type="button"
                  disabled={!extractedPreview.category}
                  onClick={() => {
                    if (!extractedPreview.category) return;
                    setUserProfile(extractedPreview);
                    if (onProceedToRecommender) {
                      onProceedToRecommender();
                    } else {
                      setActiveTab('schemes');
                    }
                  }}
                  className={`mt-1 w-full py-3 font-body font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                    extractedPreview.category
                      ? 'bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary active:scale-[0.99]'
                      : 'bg-surface-container-high text-on-surface-variant opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {extractedPreview.category
                      ? t.applyExtracted
                      : (language === 'hi' ? 'कृपया ऊपर अपनी सामाजिक श्रेणी चुनें' : 'Please select your category above to proceed')}
                  </span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            );
          })()}

          {/* Chat Input Textarea */}
          <div className="relative mt-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              placeholder={t.chatPromptPlaceholder}
              rows={4}
              disabled={isAiLoading}
              className="w-full rounded-xl border border-secondary/30 bg-surface-bright focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-sm text-on-surface p-3.5 pr-14 resize-none outline-none transition-all disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => handleSendChat()}
              disabled={!chatInput.trim() || isAiLoading}
              className="absolute right-3.5 bottom-3.5 w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center hover:bg-secondary-container hover:text-on-secondary-container disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">send</span>
            </button>
          </div>
          <p className="font-body text-xs text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs">info</span>
            <span>{t.chatPromptHelp}</span>
          </p>
        </div>
      )}
    </div>
  );
};
