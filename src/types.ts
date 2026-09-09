export type Language = 'en' | 'hi';

export type BeneficiaryCategory = 'sc' | 'st' | 'obc' | 'ews' | 'general' | 'minority' | 'pwd';

export type SpecialOccupation = 'none' | 'street_vendor' | 'artisan' | 'safai_karamchari' | 'weaver';

export type SchemeCategory = 'micro' | 'term' | 'education' | 'mahila' | 'general';

export interface UserProfile {
  purpose: 'business' | 'education' | 'agriculture' | 'sanitation' | 'services' | 'other';
  projectCost: number;
  annualIncome: number;
  category: BeneficiaryCategory;
  specialOccupation?: SpecialOccupation;
  isPwd?: boolean;
  gender?: 'male' | 'female' | 'other';
  educationLocation?: 'india' | 'abroad';
  hasAdmissionLetter?: boolean;
  hasProjectReport?: boolean;
  state?: string;
  city?: string;
}

export interface SchemeRecommendation {
  id: string;
  schemeId: string;
  nameEn: string;
  nameHi: string;
  agency: string;
  agencyShort: string;
  targetCategories: string[];
  category: SchemeCategory;
  matchPercentage: number;
  isEligible: boolean;
  maxProjectCost: number;
  maxLoanAmount: number;
  minProjectCost?: number;
  interestRate: number; // in %
  interestRateWomen?: number; // concessional rate
  interestRateNoteEn: string;
  interestRateNoteHi: string;
  repaymentYears: number;
  repaymentMonths: number;
  moratoriumMonths: number;
  incomeCeiling: number | null;
  reasonsEn: string[];
  reasonsHi: string[];
  featuresEn: string[];
  featuresHi: string[];
  nearMissGapEn?: string;
  nearMissGapHi?: string;
  isNearMiss?: boolean;
  badgeTextEn?: string;
  badgeTextHi?: string;
  verificationStatus: string;
  isCategoryFallback?: boolean;
  applicationRoute?: string;
  officialSourceLink?: string | null;
  notes?: string;
}

export interface Partner {
  id: string;
  nameEn: string;
  nameHi: string;
  type: 'SCA' | 'PSB' | 'RRB' | 'NBFC-MFI';
  typeNameEn: string;
  typeNameHi: string;
  addressEn: string;
  addressHi: string;
  city: string;
  state: string;
  distanceKm: number;
  loadStatus: 'low' | 'medium' | 'full'; // green (low), yellow (medium), red (full)
  loadLabelEn: string;
  loadLabelHi: string;
  fundUtilizationRate: number; // in %
  phone: string;
  email: string;
  timings: string;
  coordinates: { x: number; y: number; lat: number; lng: number }; // normalized coords for SVG map
  recommended: boolean;
}

export interface DocumentItem {
  id: string;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  requiredFor: SchemeCategory[];
  isMandatory: boolean;
  isReady: boolean;
  fileAttached?: string;
  helpTipEn: string;
  helpTipHi: string;
}

export interface AmortizationMonth {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
  isMoratorium: boolean;
}

export interface EmiCalculationResult {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  moratoriumMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  principalPercentage: number;
  interestPercentage: number;
  schedule: AmortizationMonth[];
}

export type ActiveTab = 'home' | 'intake' | 'schemes' | 'calculator' | 'checklist' | 'locator';
