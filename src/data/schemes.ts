import {
  SchemeRecommendation,
  UserProfile,
  EmiCalculationResult,
  AmortizationMonth,
  SchemeCategory,
} from '../types';
import { UNIFIED_SCHEMES_CATALOG, RawUnifiedScheme } from './unifiedSchemes';

export function formatIndianCurrency(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0';
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (amount >= 100000) {
    const lk = amount / 100000;
    return `₹${lk.toFixed(2).replace(/\.00$/, '')}L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFullIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Checks whether a scheme matches the user's category & layered attributes directly from the dataset's target_category field.
 */
export function checkSchemeCategoryMatch(
  scheme: RawUnifiedScheme,
  profile: UserProfile
): {
  isDirectCategoryMatch: boolean;
  isOpenGeneralMatch: boolean;
  isSpecialAttributeMatch: boolean;
} {
  const targetCats = scheme.target_category;
  const userCat = profile.category;
  const isFemale = profile.gender === 'female';
  const isPwd = profile.isPwd || profile.category === 'pwd';
  const occupation = profile.specialOccupation || 'none';

  // 1. Direct social category match
  let isDirectCategoryMatch = false;
  if (userCat === 'sc' && targetCats.includes('SC')) isDirectCategoryMatch = true;
  if (userCat === 'st' && targetCats.includes('ST')) isDirectCategoryMatch = true;
  if (userCat === 'obc' && targetCats.includes('OBC')) isDirectCategoryMatch = true;
  if (userCat === 'minority' && targetCats.includes('Minority')) isDirectCategoryMatch = true;
  if (isPwd && targetCats.includes('Persons with Disabilities')) isDirectCategoryMatch = true;

  // 2. Open / General match (PMMY, PMEGP, CGTMSE)
  const isOpenGeneralMatch = targetCats.includes('General');

  // 3. Layered attribute match (Occupation or Women)
  let isSpecialAttributeMatch = false;
  if (isFemale && targetCats.includes('Women')) isSpecialAttributeMatch = true;
  if (occupation === 'street_vendor' && targetCats.includes('Street Vendors')) isSpecialAttributeMatch = true;
  if (occupation === 'artisan' && targetCats.includes('Artisans & Craftspeople')) isSpecialAttributeMatch = true;
  if (occupation === 'safai_karamchari' && targetCats.includes('Safai Karamcharis / Manual Scavengers & Dependents')) isSpecialAttributeMatch = true;
  if (occupation === 'weaver' && targetCats.some(c => c.includes('Handloom Weavers'))) isSpecialAttributeMatch = true;

  return {
    isDirectCategoryMatch,
    isOpenGeneralMatch,
    isSpecialAttributeMatch,
  };
}

/**
 * Convert a RawUnifiedScheme to a typed SchemeRecommendation for the user profile
 */
export function mapRawToRecommendation(
  raw: RawUnifiedScheme,
  profile: UserProfile,
  isCategoryFallback: boolean = false
): SchemeRecommendation {
  const cost = profile.projectCost || 100000;
  const isFemale = profile.gender === 'female';

  // Extract numerical interest rate
  let numericRate = 8.0;
  if (typeof raw.interest_rate_beneficiary_percent_pa === 'number') {
    numericRate = raw.interest_rate_beneficiary_percent_pa;
  } else if (typeof raw.interest_rate_beneficiary_percent_pa === 'object') {
    // Pick first numerical value or female concession if available
    const obj = raw.interest_rate_beneficiary_percent_pa;
    if (isFemale && 'female' in obj) {
      numericRate = obj['female'];
    } else if ('male' in obj) {
      numericRate = obj['male'];
    } else {
      const vals = Object.values(obj);
      numericRate = vals.length > 0 ? vals[0] : 8.0;
    }
  }

  // Calculate maximum loan based on rules
  let maxLoan = raw.max_loan_amount_inr || cost;
  if (raw.max_project_cost_inr && cost <= raw.max_project_cost_inr) {
    maxLoan = Math.min(maxLoan, Math.round(cost * 0.9));
  } else if (raw.max_project_cost_inr && cost > raw.max_project_cost_inr) {
    maxLoan = raw.max_loan_amount_inr || raw.max_project_cost_inr;
  }

  // Map category archetype
  let catArchetype: SchemeCategory = 'general';
  if (raw.purpose_category === 'micro' || (raw.max_project_cost_inr && raw.max_project_cost_inr <= 150000)) {
    catArchetype = 'micro';
  } else if (raw.purpose_category === 'education') {
    catArchetype = 'education';
  } else if (raw.target_category.includes('Women') && raw.target_category.length === 1) {
    catArchetype = 'mahila';
  } else {
    catArchetype = 'term';
  }

  // Check income ceiling
  let incomeLimit: number | null = null;
  if (typeof raw.income_ceiling_inr === 'number') {
    incomeLimit = raw.income_ceiling_inr;
  } else if (typeof raw.income_ceiling_inr === 'object' && raw.income_ceiling_inr !== null) {
    incomeLimit = Math.max(...Object.values(raw.income_ceiling_inr));
  }

  const incomeOk = incomeLimit === null || profile.annualIncome <= incomeLimit;

  // Repayment years
  const repaymentYears = typeof raw.repayment_years_max === 'number' ? raw.repayment_years_max : 5;

  // Reasons
  const reasonsEn: string[] = [];
  const reasonsHi: string[] = [];

  if (isCategoryFallback) {
    reasonsEn.push('Open national welfare scheme accessible across all categories');
    reasonsHi.push('सभी श्रेणियों के लिए खुली राष्ट्रीय कल्याणकारी योजना');
  } else {
    reasonsEn.push(`Matches your category: ${raw.target_category.join(', ')}`);
    reasonsHi.push(`आपकी पात्रता श्रेणी से सुसंगत: ${raw.target_category.join(', ')}`);
  }

  if (incomeLimit === null) {
    reasonsEn.push('No mandatory family income ceiling barrier');
    reasonsHi.push('कोई अनिवार्य पारिवारिक आय सीमा बाधा नहीं');
  } else if (incomeOk) {
    reasonsEn.push(`Annual family income is within the ₹${(incomeLimit / 100000).toFixed(1)}L ceiling`);
    reasonsHi.push(`पारिवारिक आय ₹${(incomeLimit / 100000).toFixed(1)} लाख की निर्धारित सीमा में है`);
  }

  if (raw.max_project_cost_inr) {
    reasonsEn.push(`Project cost fits within scheme limit (up to ₹${(raw.max_project_cost_inr / 100000).toFixed(1)}L)`);
    reasonsHi.push(`परियोजना लागत योजना सीमा (₹${(raw.max_project_cost_inr / 100000).toFixed(1)} लाख तक) के अनुकूल है`);
  }

  const isEligible = incomeOk && raw.verification_status !== 'closed_or_expired' && raw.verification_status !== 'applications_closed_as_of_2026_08_01';

  return {
    id: raw.scheme_id,
    schemeId: raw.scheme_id,
    nameEn: raw.scheme_name,
    nameHi: raw.scheme_name_hi,
    agency: raw.ministry_or_agency,
    agencyShort: raw.agency_short,
    targetCategories: raw.target_category,
    category: catArchetype,
    matchPercentage: 92,
    isEligible,
    maxProjectCost: raw.max_project_cost_inr || 5000000,
    maxLoanAmount: maxLoan,
    minProjectCost: raw.min_project_cost_inr || 10000,
    interestRate: numericRate,
    interestRateWomen: isFemale && numericRate > 4 ? numericRate - 1 : undefined,
    interestRateNoteEn: raw.interest_rate_display_en,
    interestRateNoteHi: raw.interest_rate_display_hi,
    repaymentYears,
    repaymentMonths: raw.repayment_months_calculated,
    moratoriumMonths: raw.moratorium_months,
    incomeCeiling: incomeLimit,
    reasonsEn,
    reasonsHi,
    featuresEn: raw.features_en,
    featuresHi: raw.features_hi,
    verificationStatus: raw.verification_status,
    isCategoryFallback,
    applicationRoute: raw.application_route,
    officialSourceLink: raw.official_source_link,
    notes: raw.notes,
  };
}

/**
 * Universal Rule-Based Eligibility Engine based on Unified 20-Schemes Catalog
 */
export function evaluateEligibility(profile: UserProfile): {
  isGatePassed: boolean;
  gateFailureReasonEn?: string;
  gateFailureReasonHi?: string;
  isFallbackActive: boolean;
  primaryScheme: SchemeRecommendation;
  allEligibleSchemes: SchemeRecommendation[];
  nearMisses: SchemeRecommendation[];
} {
  const cost = profile.projectCost || 100000;
  const isEducation = profile.purpose === 'education';
  const occupation = profile.specialOccupation || 'none';

  // 1. Separate schemes into direct/special category matches vs general open schemes
  const directMatches: RawUnifiedScheme[] = [];
  const openGeneralSchemes: RawUnifiedScheme[] = [];

  for (const scheme of UNIFIED_SCHEMES_CATALOG) {
    const { isDirectCategoryMatch, isOpenGeneralMatch, isSpecialAttributeMatch } = checkSchemeCategoryMatch(
      scheme,
      profile
    );

    if (isDirectCategoryMatch || isSpecialAttributeMatch) {
      directMatches.push(scheme);
    } else if (isOpenGeneralMatch) {
      openGeneralSchemes.push(scheme);
    }
  }

  // Check if any direct category-specific schemes exist
  const hasDirectCategorySchemes = directMatches.length > 0;
  const isFallbackActive = !hasDirectCategorySchemes;

  // Pool of candidate schemes to rank
  const candidateRawList = hasDirectCategorySchemes ? directMatches : openGeneralSchemes;

  // Score and rank candidates based on purpose, project cost fit, and income
  const scoredCandidates = candidateRawList.map(raw => {
    let score = 50;

    // Active verification bonus
    if (raw.verification_status === 'verified_current' || raw.verification_status === 'verified_current_scheme') {
      score += 20;
    } else if (raw.verification_status === 'closed_or_expired' || raw.verification_status === 'applications_closed_as_of_2026_08_01') {
      score -= 40;
    }

    // Purpose match
    if (isEducation) {
      if (raw.purpose_category === 'education') score += 45;
      else score -= 30;
    } else {
      if (raw.purpose_category === 'education') score -= 30;
      else score += 10;
    }

    // Special occupation match
    if (occupation === 'street_vendor' && raw.scheme_id === 'S10') score += 50;
    if (occupation === 'artisan' && raw.scheme_id === 'S11') score += 50;
    if (occupation === 'safai_karamchari' && raw.scheme_id === 'S13') score += 50;
    if (occupation === 'weaver' && raw.scheme_id === 'S19') score += 50;

    // Cost fit
    if (raw.max_project_cost_inr) {
      if (cost <= raw.max_project_cost_inr) {
        if (cost >= (raw.min_project_cost_inr || 0)) {
          score += 25;
        } else {
          score += 10;
        }
      } else {
        score -= 20;
      }
    } else {
      score += 10;
    }

    // Income ceiling fit
    if (typeof raw.income_ceiling_inr === 'number') {
      if (profile.annualIncome <= raw.income_ceiling_inr) {
        score += 15;
      } else {
        score -= 35; // Income disqualified
      }
    }

    return { raw, score };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  // Convert top scheme to primary
  const primaryRaw = scoredCandidates[0]?.raw || openGeneralSchemes[0] || UNIFIED_SCHEMES_CATALOG[0];
  const primaryScheme = mapRawToRecommendation(primaryRaw, profile, isFallbackActive);

  // Check gate for primary scheme
  let isGatePassed = true;
  let gateFailureReasonEn: string | undefined;
  let gateFailureReasonHi: string | undefined;

  if (primaryScheme.incomeCeiling && profile.annualIncome > primaryScheme.incomeCeiling) {
    isGatePassed = false;
    gateFailureReasonEn = `Annual family income (₹${profile.annualIncome.toLocaleString('en-IN')}) exceeds the scheme limit of ₹${primaryScheme.incomeCeiling.toLocaleString('en-IN')}.`;
    gateFailureReasonHi = `पारिवारिक वार्षिक आय (₹${profile.annualIncome.toLocaleString('en-IN')}) योजना की अधिकतम सीमा ₹${primaryScheme.incomeCeiling.toLocaleString('en-IN')} से अधिक है।`;
  }

  // All eligible schemes
  const allEligibleSchemes: SchemeRecommendation[] = [];
  const candidatePool = [...scoredCandidates.map(c => c.raw), ...openGeneralSchemes];
  const uniquePool = Array.from(new Set(candidatePool.map(r => r.scheme_id)))
    .map(id => candidatePool.find(r => r.scheme_id === id)!);

  for (const raw of uniquePool) {
    const isFallback = !directMatches.some(d => d.scheme_id === raw.scheme_id);
    const rec = mapRawToRecommendation(raw, profile, isFallbackActive && isFallback);
    if (rec.isEligible && rec.schemeId !== primaryScheme.schemeId) {
      allEligibleSchemes.push(rec);
    }
  }

  // Near misses (e.g. schemes where project cost is slightly different or requires higher amount)
  const nearMisses: SchemeRecommendation[] = [];
  for (const raw of uniquePool) {
    if (raw.scheme_id === primaryScheme.schemeId) continue;
    if (raw.verification_status === 'closed_or_expired' || raw.verification_status === 'applications_closed_as_of_2026_08_01') continue;

    const rec = mapRawToRecommendation(raw, profile, isFallbackActive);
    if (raw.max_project_cost_inr && cost > raw.max_project_cost_inr) {
      nearMisses.push({
        ...rec,
        isNearMiss: true,
        nearMissGapEn: `Cap gap: Scheme project cost limit is ₹${formatIndianCurrency(raw.max_project_cost_inr)}.`,
        nearMissGapHi: `लागत अंतर: योजना परियोजना सीमा ₹${formatIndianCurrency(raw.max_project_cost_inr)} तक सीमित है।`,
      });
    } else if (raw.min_project_cost_inr && cost < raw.min_project_cost_inr) {
      nearMisses.push({
        ...rec,
        isNearMiss: true,
        nearMissGapEn: `Minimum project cost requirement is ₹${formatIndianCurrency(raw.min_project_cost_inr)}.`,
        nearMissGapHi: `न्यूनतम परियोजना लागत आवश्यकता ₹${formatIndianCurrency(raw.min_project_cost_inr)} है।`,
      });
    }
  }

  return {
    isGatePassed,
    gateFailureReasonEn,
    gateFailureReasonHi,
    isFallbackActive,
    primaryScheme,
    allEligibleSchemes,
    nearMisses: nearMisses.slice(0, 3),
  };
}

/**
 * Standard Amortization Formula:
 * EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateEmi(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  moratoriumMonths: number = 0
): EmiCalculationResult {
  const P = Math.max(0, principal);
  const R = Math.max(0.1, annualInterestRate);
  const n = Math.max(1, tenureMonths);
  const mor = Math.max(0, moratoriumMonths);

  const monthlyRate = R / (12 * 100);

  let monthlyEmi = 0;
  if (P > 0 && n > 0) {
    if (monthlyRate === 0) {
      monthlyEmi = P / n;
    } else {
      const compoundFactor = Math.pow(1 + monthlyRate, n);
      monthlyEmi = (P * monthlyRate * compoundFactor) / (compoundFactor - 1);
    }
  }

  const roundedEmi = Math.round(monthlyEmi);
  const totalRepayment = roundedEmi * n;
  const totalInterest = Math.max(0, totalRepayment - P);

  const principalPercentage = totalRepayment > 0 ? Math.round((P / totalRepayment) * 100) : 100;
  const interestPercentage = totalRepayment > 0 ? Math.max(0, 100 - principalPercentage) : 0;

  // Generate Amortization Schedule
  const schedule: AmortizationMonth[] = [];
  let remainingBalance = P;

  // Moratorium Months (Interest accrued)
  for (let m = 1; m <= mor; m++) {
    const monthlyAccruedInterest = Math.round(remainingBalance * monthlyRate);
    schedule.push({
      month: m,
      emi: 0,
      principal: 0,
      interest: monthlyAccruedInterest,
      balance: remainingBalance,
      isMoratorium: true,
    });
  }

  // Active Repayment Months
  for (let m = 1; m <= n; m++) {
    const interestForMonth = Math.round(remainingBalance * monthlyRate);
    let principalForMonth = roundedEmi - interestForMonth;
    if (m === n || principalForMonth > remainingBalance) {
      principalForMonth = remainingBalance;
    }
    remainingBalance = Math.max(0, remainingBalance - principalForMonth);

    schedule.push({
      month: mor + m,
      emi: roundedEmi,
      principal: principalForMonth,
      interest: interestForMonth,
      balance: remainingBalance,
      isMoratorium: false,
    });
  }

  return {
    principal: P,
    annualInterestRate: R,
    tenureMonths: n,
    moratoriumMonths: mor,
    monthlyEmi: roundedEmi,
    totalInterest,
    totalRepayment,
    principalPercentage,
    interestPercentage,
    schedule,
  };
}
