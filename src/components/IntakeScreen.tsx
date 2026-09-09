import React, { useState } from 'react';
import { Language, UserProfile, BeneficiaryCategory, SpecialOccupation } from '../types';
import { translations } from '../data/translations';
import { evaluateEligibility } from '../data/schemes';

interface IntakeScreenProps {
  language: Language;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onProceedToRecommender: () => void;
  initialMode?: 'form' | 'chat';
}

export const IntakeScreen: React.FC<IntakeScreenProps> = ({
  language,
  profile,
  onUpdateProfile,
  onProceedToRecommender,
  initialMode = 'form',
}) => {
  const t = translations[language];
  const [mode, setMode] = useState<'form' | 'chat'>(initialMode);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<UserProfile | null>(null);

  const handleFormChange = (field: keyof UserProfile, value: any) => {
    onUpdateProfile({
      ...profile,
      [field]: value,
    });
  };

  const handleSendChat = async (textToSend?: string) => {
    const prompt = textToSend !== undefined ? textToSend : chatInput;
    if (!prompt.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiMessage(null);
    setExtractedPreview(null);

    try {
      const response = await fetch('/api/ai/parse-situation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userText: prompt, language }),
      });

      if (!response.ok) throw new Error('Failed to parse situation');
      const data = await response.json();

      const validPurposes: UserProfile['purpose'][] = ['business', 'education', 'agriculture', 'sanitation', 'services', 'other'];
      const parsedPurpose = validPurposes.includes(data.purpose) ? data.purpose : 'business';

      const validCategories: BeneficiaryCategory[] = ['sc', 'st', 'obc', 'ews', 'general', 'minority', 'pwd'];
      const parsedCategory: BeneficiaryCategory = validCategories.includes(data.category) ? data.category : 'sc';

      const validOccupations: SpecialOccupation[] = ['none', 'street_vendor', 'artisan', 'safai_karamchari', 'weaver'];
      const parsedOccupation: SpecialOccupation = validOccupations.includes(data.specialOccupation) ? data.specialOccupation : 'none';

      const newProfile: UserProfile = {
        purpose: parsedPurpose,
        projectCost: typeof data.projectCost === 'number' && data.projectCost > 0 ? data.projectCost : 120000,
        annualIncome: typeof data.annualIncome === 'number' && data.annualIncome >= 0 ? data.annualIncome : 200000,
        category: parsedCategory,
        specialOccupation: parsedOccupation,
        isPwd: Boolean(data.isPwd || parsedCategory === 'pwd'),
        gender: data.gender === 'female' || data.gender === 'other' ? data.gender : 'male',
        educationLocation: data.educationLocation === 'abroad' ? 'abroad' : 'india',
      };

      // Set state and notify parent profile synchronously
      setExtractedPreview(newProfile);
      setAiMessage(language === 'hi' ? data.explanationHi : data.explanationEn);
      onUpdateProfile(newProfile);
    } catch (err: any) {
      console.error(err);
      // Fallback local extraction if server API encountered network glitch
      const lower = prompt.toLowerCase();
      let cost = 120000;
      let income = 200000;

      const incMatch = prompt.match(/income\s*(?:is|of|:)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|l)/i);
      if (incMatch) income = Math.round(parseFloat(incMatch[1]) * 100000);

      const numMatch = prompt.match(/(?:cost|loan|need|require|amount|fee|fees)\s*(?:of|is|:)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|l)/i) ||
                        prompt.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|l)/i);
      if (numMatch) cost = Math.round(parseFloat(numMatch[1]) * 100000);

      const isEdu = lower.includes('education') || lower.includes('college') || lower.includes('study') || lower.includes('degree') || lower.includes('btech') || lower.includes('b.tech') || lower.includes('mba') || lower.includes('fee') || lower.includes('शिक्षा');
      const isAbroad = lower.includes('abroad') || lower.includes('foreign') || lower.includes('usa') || lower.includes('uk') || lower.includes('विदेश');
      const isFemale = lower.includes('woman') || lower.includes('female') || lower.includes('girl') || lower.includes('lady') || lower.includes('महिला') || lower.includes('लड़की');

      let fallbackCat: BeneficiaryCategory = 'sc';
      if (lower.includes('st ') || lower.includes('tribal') || lower.includes('आदिवासी')) fallbackCat = 'st';
      else if (lower.includes('obc') || lower.includes('पिछड़ा')) fallbackCat = 'obc';
      else if (lower.includes('minority') || lower.includes('अल्पसंख्यक')) fallbackCat = 'minority';
      else if (lower.includes('pwd') || lower.includes('disabled') || lower.includes('दिव्यांग')) fallbackCat = 'pwd';
      else if (lower.includes('general') || lower.includes('सामान्य')) fallbackCat = 'general';

      let fallbackOcc: SpecialOccupation = 'none';
      if (lower.includes('vendor') || lower.includes('hawker') || lower.includes('रेहड़ी')) fallbackOcc = 'street_vendor';
      else if (lower.includes('artisan') || lower.includes('craft') || lower.includes('vishwakarma') || lower.includes('कारीगर')) fallbackOcc = 'artisan';
      else if (lower.includes('sanitation') || lower.includes('safai') || lower.includes('सफाई')) fallbackOcc = 'safai_karamchari';
      else if (lower.includes('weaver') || lower.includes('handloom') || lower.includes('बुनकर')) fallbackOcc = 'weaver';

      const fallbackProfile: UserProfile = {
        purpose: isEdu ? 'education' : 'business',
        projectCost: cost,
        annualIncome: income,
        category: fallbackCat,
        specialOccupation: fallbackOcc,
        isPwd: fallbackCat === 'pwd',
        gender: isFemale ? 'female' : 'male',
        educationLocation: isAbroad ? 'abroad' : 'india',
      };

      setExtractedPreview(fallbackProfile);
      onUpdateProfile(fallbackProfile);
      setAiMessage(
        language === 'hi'
          ? `हमने आपकी जानकारी निकाली है: ₹${cost.toLocaleString('en-IN')} (${isEdu ? 'पाठ्यक्रम शुल्क' : 'परियोजना लागत'}), श्रेणी: ${fallbackCat.toUpperCase()}। नीचे दिए गए बटन से योजनाएं देखें।`
          : `Extracted details: ₹${cost.toLocaleString('en-IN')} (${isEdu ? 'Course Fee' : 'Project Cost'}), Category: ${fallbackCat.toUpperCase()}. Click below to view eligible schemes.`
      );
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
          onClick={() => setMode('form')}
          className={`flex-1 py-2.5 text-center font-body font-bold text-sm rounded-lg transition-all cursor-pointer ${
            mode === 'form'
              ? 'bg-surface-container-lowest shadow-xs text-primary'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60'
          }`}
        >
          {t.formMode}
        </button>
        <button
          onClick={() => setMode('chat')}
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
              {profile.purpose === 'education' ? '🎓 Education Track' : '💼 Business & Trade Track'}
            </span>
          </div>

          <div className="space-y-4">
            {/* Purpose */}
            <div>
              <label className="block font-body font-bold text-sm text-on-surface mb-1.5">
                {t.purposeLabel}
              </label>
              <select
                value={profile.purpose}
                onChange={(e) => handleFormChange('purpose', e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-primary/20 bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-on-surface p-3 outline-none transition-all"
              >
                <option value="business">{t.purposeBusiness}</option>
                <option value="education">{t.purposeEducation}</option>
                <option value="agriculture">{t.purposeAgriculture}</option>
                <option value="sanitation">{t.purposeSanitation}</option>
                <option value="services">{t.purposeServices}</option>
              </select>
            </div>

            {/* If Education: India or Abroad */}
            {profile.purpose === 'education' && (
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
                      checked={profile.educationLocation !== 'abroad'}
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
                      checked={profile.educationLocation === 'abroad'}
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
                {profile.purpose === 'education' ? (language === 'hi' ? 'पाठ्यक्रम शुल्क (₹) / Course Fee' : 'Course Fee (₹)') : t.estimatedCostLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-bold text-base">₹</span>
                <input
                  type="number"
                  value={profile.projectCost || ''}
                  onChange={(e) => handleFormChange('projectCost', Math.max(0, parseInt(e.target.value, 10) || 0))}
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
                  value={profile.annualIncome || ''}
                  onChange={(e) => handleFormChange('annualIncome', Math.max(0, parseInt(e.target.value, 10) || 0))}
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
                  {t.categoryLabel}
                </label>
                <span className="text-[11px] font-semibold text-secondary-container">Hard filter</span>
              </div>
              <select
                value={profile.category}
                onChange={(e) => handleFormChange('category', e.target.value as BeneficiaryCategory)}
                className="w-full min-h-[48px] rounded-xl border border-primary/30 bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-on-surface font-semibold p-3 outline-none transition-all"
              >
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
                value={profile.specialOccupation || 'none'}
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
            {profile.category !== 'pwd' && (
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
                      profile.isPwd
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
                      !profile.isPwd
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
                      profile.gender === g
                        ? 'border-primary bg-primary text-on-primary font-bold shadow-xs'
                        : 'border-outline-variant/40 bg-surface-bright hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    {g === 'female' ? t.female : g === 'male' ? t.male : t.other}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={onProceedToRecommender}
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

          {/* AI Response & Extracted Details Card */}
          {!isAiLoading && extractedPreview && (() => {
            const isEdu = extractedPreview.purpose === 'education';
            const { primaryScheme, isFallbackActive } = evaluateEligibility(extractedPreview);
            const costLabel = isEdu
              ? (language === 'hi' ? 'पाठ्यक्रम शुल्क (Course Fee)' : 'Course Fee')
              : (language === 'hi' ? 'परियोजना लागत (Project Cost)' : 'Project Cost');
            const purposeDisplay = {
              education: language === 'hi' ? '🎓 शिक्षा (Education)' : '🎓 Education',
              business: language === 'hi' ? '💼 व्यवसाय (Business)' : '💼 Business',
              agriculture: language === 'hi' ? '🚜 कृषि (Agriculture)' : '🚜 Agriculture',
              sanitation: language === 'hi' ? '🧹 स्वच्छता (Sanitation)' : '🧹 Sanitation',
              services: language === 'hi' ? '🚗 सेवा / परिवहन (Services)' : '🚗 Services',
              other: language === 'hi' ? '📋 अन्य (Other)' : '📋 Other',
            }[extractedPreview.purpose] || extractedPreview.purpose;

            const occupationDisplay = {
              none: '',
              street_vendor: '🛒 PM SVANidhi Vendor',
              artisan: '🔨 PM Vishwakarma Artisan',
              safai_karamchari: '🧹 NSKFDC Sanitation',
              weaver: '🧵 Weaver MUDRA',
            }[extractedPreview.specialOccupation || 'none'];

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

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-outline-variant/30 text-xs">
                  <div className="bg-surface-bright p-2.5 rounded-lg border border-outline-variant/30">
                    <span className="text-on-surface-variant block font-medium text-[11px]">{costLabel}:</span>
                    <span className="font-bold text-primary text-sm">₹{extractedPreview.projectCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-surface-bright p-2.5 rounded-lg border border-outline-variant/30">
                    <span className="text-on-surface-variant block font-medium text-[11px]">
                      {language === 'hi' ? 'वार्षिक आय:' : 'Annual Income:'}
                    </span>
                    <span className="font-bold text-primary text-sm">₹{extractedPreview.annualIncome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-surface-bright p-2.5 rounded-lg border border-outline-variant/30">
                    <span className="text-on-surface-variant block font-medium text-[11px]">
                      {language === 'hi' ? 'श्रेणी (Category):' : 'Social Category:'}
                    </span>
                    <span className="font-bold text-tertiary-container text-sm uppercase">
                      {extractedPreview.category}
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
                </div>

                {/* Target scheme route badge */}
                <div className="flex items-center justify-between p-2.5 bg-primary-fixed/30 rounded-lg border border-primary/20 text-xs flex-wrap gap-2">
                  <span className="text-on-surface-variant font-semibold">{t.schemeRouting}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-bright text-primary border border-primary/20">
                      {primaryScheme.agencyShort}
                    </span>
                    <span className="font-bold text-primary">
                      {language === 'hi' ? primaryScheme.nameHi : primaryScheme.nameEn}
                    </span>
                  </div>
                </div>

                {isFallbackActive && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-md border border-amber-200">
                    ℹ️ {language === 'hi' ? t.fallbackNoticeMsg : t.fallbackNoticeMsg}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile(extractedPreview);
                    onProceedToRecommender();
                  }}
                  className="mt-1 w-full py-3 bg-secondary-container text-on-secondary-container font-body font-bold text-sm rounded-xl hover:bg-secondary hover:text-on-secondary transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99]"
                >
                  <span>{t.applyExtracted}</span>
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
              className="absolute bottom-3.5 right-3.5 bg-secondary-container text-on-secondary-container rounded-full w-10 h-10 flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Parse Situation"
            >
              {isAiLoading ? (
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
              ) : (
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  send
                </span>
              )}
            </button>
          </div>
          <p className="text-center font-body text-xs text-on-surface-variant">
            {t.chatPromptHelp}
          </p>
        </div>
      )}
    </div>
  );
};
