export type Language = 'en' | 'hi';

export type BeneficiaryCategory = 'sc' | 'st' | 'obc' | 'ews' | 'general' | 'minority' | 'pwd';

export type SpecialOccupation = 'none' | 'street_vendor' | 'artisan' | 'safai_karamchari' | 'weaver';

export type SchemeCategory = 'micro' | 'term' | 'education' | 'mahila' | 'general';

export type PurposeType = 'business' | 'education' | 'agriculture' | 'sanitation' | 'services' | 'other';

export interface UserProfile {
  purpose: PurposeType | null;
  projectCost: number | null;
  annualIncome: number | null;
  category: BeneficiaryCategory | null;
  specialOccupation?: SpecialOccupation | null;
  isPwd?: boolean;
  gender?: 'male' | 'female' | 'other';
  educationLocation?: 'india' | 'abroad';
  hasAdmissionLetter?: boolean;
  hasProjectReport?: boolean;
  state?: string;
  city?: string;
}

export interface CalculatorState {
  schemeId: string | null;
  schemeNameEn: string | null;
  schemeNameHi: string | null;
  agency: string | null;
  agencyShort: string | null;
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  moratoriumMonths: number;
  isAutoPopulated: boolean;
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

export type AgencyType = 'SCA' | 'RRB' | 'Nationalised Bank';

export interface Partner {
  id: string;
  agencyName: string;
  agencyType: AgencyType;
  state: string;
  city: string;
  address: string;
  phone: string[];
  fax?: string;
  email: string[];
  website?: string;
  note?: string;
  corporationsCovered?: string;
  dataSource: 'verified';
  sourceReference: string;
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
