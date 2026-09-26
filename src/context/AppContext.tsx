import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Language,
  UserProfile,
  SchemeRecommendation,
  CalculatorState,
  ActiveTab,
} from '../types';

interface AppContextType {
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  toggleLanguage: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  intakeInitialMode: 'form' | 'chat';
  setIntakeInitialMode: (mode: 'form' | 'chat') => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;

  // Profile - Single Source of Truth
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateUserProfile: (updater: Partial<UserProfile>) => void;
  hasSufficientProfile: boolean;

  // Selected Scheme - Single Source of Truth
  selectedScheme: SchemeRecommendation | null;
  setSelectedScheme: (scheme: SchemeRecommendation | null) => void;

  // Calculator - Single Source of Truth
  calculatorState: CalculatorState;
  setCalculatorState: React.Dispatch<React.SetStateAction<CalculatorState>>;
  updateCalculatorState: (updater: Partial<CalculatorState>) => void;

  // Integrated Navigation actions
  selectSchemeAndNavigateToCalculator: (scheme: SchemeRecommendation, requestedCost?: number) => void;
  selectSchemeAndNavigateToChecklist: (scheme: SchemeRecommendation) => void;
}

const initialUserProfile: UserProfile = {
  purpose: null,
  projectCost: null,
  annualIncome: null,
  category: null,
  specialOccupation: 'none',
  isPwd: false,
  gender: 'male',
  educationLocation: 'india',
  city: '',
  state: '',
};

const initialCalculatorState: CalculatorState = {
  schemeId: null,
  schemeNameEn: null,
  schemeNameHi: null,
  agency: null,
  agencyShort: null,
  loanAmount: 100000,
  interestRate: 6.0,
  tenureMonths: 36,
  moratoriumMonths: 3,
  isAutoPopulated: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [intakeInitialMode, setIntakeInitialMode] = useState<'form' | 'chat'>('form');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [selectedScheme, setSelectedScheme] = useState<SchemeRecommendation | null>(null);
  const [calculatorState, setCalculatorState] = useState<CalculatorState>(initialCalculatorState);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const updateUserProfile = (fields: Partial<UserProfile>) => {
    setUserProfile(prev => ({
      ...prev,
      ...fields,
    }));
  };

  const updateCalculatorState = (fields: Partial<CalculatorState>) => {
    setCalculatorState(prev => ({
      ...prev,
      ...fields,
    }));
  };

  const hasSufficientProfile = Boolean(
    userProfile.category &&
    userProfile.purpose &&
    typeof userProfile.projectCost === 'number' &&
    userProfile.projectCost > 0
  );

  const selectSchemeAndNavigateToCalculator = (
    scheme: SchemeRecommendation,
    requestedLoanAmount?: number
  ) => {
    setSelectedScheme(scheme);

    // Set loan amount: use explicit requested amount if provided (e.g. custom slider requirement bounded by scheme max),
    // otherwise default directly to the scheme's real maxLoanAmount.
    let loanAmount = scheme.maxLoanAmount;
    if (typeof requestedLoanAmount === 'number' && requestedLoanAmount > 0) {
      loanAmount = Math.min(requestedLoanAmount, scheme.maxLoanAmount);
    }

    const isFemale = userProfile.gender === 'female';
    const interestRate = (isFemale && scheme.interestRateWomen)
      ? scheme.interestRateWomen
      : scheme.interestRate;

    setCalculatorState({
      schemeId: scheme.id,
      schemeNameEn: scheme.nameEn,
      schemeNameHi: scheme.nameHi,
      agency: scheme.agency,
      agencyShort: scheme.agencyShort,
      loanAmount,
      interestRate,
      tenureMonths: scheme.repaymentMonths || (scheme.repaymentYears * 12) || 36,
      moratoriumMonths: scheme.moratoriumMonths || 0,
      isAutoPopulated: true,
    });

    setActiveTab('calculator');
  };

  const selectSchemeAndNavigateToChecklist = (scheme: SchemeRecommendation) => {
    setSelectedScheme(scheme);
    setActiveTab('checklist');
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        activeTab,
        setActiveTab,
        intakeInitialMode,
        setIntakeInitialMode,
        isDrawerOpen,
        setIsDrawerOpen,
        userProfile,
        setUserProfile,
        updateUserProfile,
        hasSufficientProfile,
        selectedScheme,
        setSelectedScheme,
        calculatorState,
        setCalculatorState,
        updateCalculatorState,
        selectSchemeAndNavigateToCalculator,
        selectSchemeAndNavigateToChecklist,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
