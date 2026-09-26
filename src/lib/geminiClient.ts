// src/lib/geminiClient.ts

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-3.6-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// ---------- Garbage detection (unchanged from server.ts) ----------
function detectGarbageInput(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 4) return true;
  const lower = trimmed.toLowerCase();

  if (/(asdf|qwer|zxcv|hjkl|jkl;|asdkj|blah blah)/i.test(lower)) {
    const hasMeaningfulContext = /(loan|ऋण|लोन|education|शिक्षा|business|व्यापार|व्यवसाय|tailor|shop|दुकान|vendor|artisan|lakh|लाख|thousand|हजार|₹|rupees)/i.test(lower);
    if (!hasMeaningfulContext) return true;
  }

  const words = lower.split(/[^a-z0-9\u0900-\u097F]+/).filter(w => w.length > 0);
  if (words.length === 0) return true;

  const recognizedKeywords = [
    'sc', 'st', 'obc', 'ews', 'general', 'minority', 'pwd', 'divyang', 'disabled', 'handicap',
    'scheduled', 'caste', 'tribe', 'backward', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'parsi',
    'अनुसूचित', 'जाति', 'जनजाति', 'पिछड़ा', 'अल्पसंख्यक', 'दिव्यांग', 'सामान्य',
    'education', 'study', 'college', 'school', 'university', 'btech', 'mba', 'mbbs', 'degree', 'course', 'fee', 'fees', 'tuition',
    'business', 'shop', 'store', 'retail', 'tailoring', 'tailor', 'factory', 'enterprise', 'trading', 'manufacturing', 'firm',
    'agriculture', 'farming', 'dairy', 'poultry', 'cattle', 'fishery', 'goat',
    'sanitation', 'safai', 'cleaning', 'sewer', 'scavenger',
    'services', 'transport', 'taxi', 'vehicle', 'auto',
    'शिक्षा', 'पढ़ाई', 'कॉलेज', 'डिग्री', 'फीस', 'व्यवसाय', 'व्यापार', 'दुकान', 'सिलाई', 'कृषि', 'खेती', 'डेयरी', 'स्वच्छता', 'सफाई',
    'loan', 'credit', 'cost', 'amount', 'need', 'require', 'fund', 'rupee', 'rupees', 'rs', 'inr', 'lakh', 'lakhs', 'lac', 'crore', 'thousand',
    'income', 'salary', 'earning', 'per', 'annum', 'year', 'monthly',
    'ऋण', 'लोन', 'लाख', 'रुपये', 'हजार', 'आय', 'वार्षिक', 'आवश्यकता', 'चाहिए',
    'vendor', 'hawker', 'street', 'thela', 'rehri', 'artisan', 'craft', 'vishwakarma', 'carpenter', 'blacksmith', 'potter', 'weaver', 'handloom',
    'woman', 'female', 'girl', 'lady', 'widow', 'mother', 'sister', 'male', 'man',
    'महिला', 'लड़की', 'कारीगर', 'शिल्पकार', 'विश्वकर्मा', 'बुनकर', 'विक्रेता'
  ];

  return words.filter(w => recognizedKeywords.includes(w)).length === 0;
}

// ---------- Heuristic extractor (unchanged from server.ts) ----------
function extractHeuristicParameters(userText: string) {
  const lower = userText.toLowerCase();

  let detectedCategory: string | null = null;
  if (/\b(sc|scheduled caste|अनुसूचित जाति)\b/i.test(userText)) detectedCategory = 'sc';
  else if (/\b(st|scheduled tribe|जनजाति|आदिवासी)\b/i.test(userText)) detectedCategory = 'st';
  else if (/\b(obc|backward class|पिछड़ा वर्ग|पिछड़ा)\b/i.test(userText)) detectedCategory = 'obc';
  else if (/\b(minority|muslim|christian|sikh|buddhist|jain|parsi|अल्पसंख्यक)\b/i.test(userText)) detectedCategory = 'minority';
  else if (/\b(pwd|disabled|disability|handicap|divyang|दिव्यांग)\b/i.test(userText)) detectedCategory = 'pwd';
  else if (/\b(ews|economically weaker)\b/i.test(userText)) detectedCategory = 'ews';
  else if (/\b(general|सामान्य)\b/i.test(userText)) detectedCategory = 'general';

  let detectedPurpose: string | null = null;
  const isEdu = /(education|college|study|degree|btech|b\.tech|mba|mbbs|course|fee|fees|tuition|school|university|शिक्षा|पढ़ाई)/i.test(lower);
  const isAgri = /(agri|farm|farming|dairy|cattle|poultry|goat|crop|कृषि|खेती|डेयरी|पशुपालन)/i.test(lower);
  const isSanitation = /(sanitation|safai|scavenger|sewer|स्वच्छता|सफाई कर्मचारी)/i.test(lower);
  const isServices = /(transport|passenger|taxi|driver|auto|service center|परिवहन|सेवा)/i.test(lower);
  const isBusiness = /(business|shop|store|tailor|tailoring|retail|enterprise|cart|vendor|artisan|craft|weaver|व्यापार|दुकान|व्यवसाय|सिलाई)/i.test(lower);

  if (isEdu) detectedPurpose = 'education';
  else if (isAgri) detectedPurpose = 'agriculture';
  else if (isSanitation) detectedPurpose = 'sanitation';
  else if (isServices) detectedPurpose = 'services';
  else if (isBusiness) detectedPurpose = 'business';

  let detectedCost: number | null = null;
  const lakhMatch = userText.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|l|लाख)/i);
  if (lakhMatch) {
    detectedCost = Math.round(parseFloat(lakhMatch[1]) * 100000);
  } else {
    const thousandMatch = userText.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k|हजार)/i);
    if (thousandMatch) {
      detectedCost = Math.round(parseFloat(thousandMatch[1]) * 1000);
    } else {
      const rupeeMatch = userText.match(/(?:₹|rs\.?|inr)\s*(\d{4,8})/i);
      if (rupeeMatch) detectedCost = parseInt(rupeeMatch[1], 10);
    }
  }

  let detectedIncome: number | null = null;
  const incomeLakhMatch = userText.match(/income\s*(?:is|of|:)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|l)/i) ||
                          userText.match(/आय\s*(?:है|:)?\s*(?:₹|रु\.?)?\s*(\d+(?:\.\d+)?)\s*(?:लाख)/i);
  if (incomeLakhMatch) {
    detectedIncome = Math.round(parseFloat(incomeLakhMatch[1]) * 100000);
  } else {
    const incomeRupeeMatch = userText.match(/(?:annual|family)?\s*income\s*(?:is|of|:)?\s*(?:₹|rs\.?|inr)\s*(\d{4,8})/i);
    if (incomeRupeeMatch) detectedIncome = parseInt(incomeRupeeMatch[1], 10);
  }

  let detectedOccupation: string = 'none';
  if (/(vendor|hawker|street|रेहड़ी|ठेला|फेरी)/i.test(lower)) detectedOccupation = 'street_vendor';
  else if (/(artisan|craft|vishwakarma|carpenter|blacksmith|कारीगर|शिल्पकार|विश्वकर्मा)/i.test(lower)) detectedOccupation = 'artisan';
  else if (/(sanitation|safai|scavenger|सफाई)/i.test(lower)) detectedOccupation = 'safai_karamchari';
  else if (/(weaver|handloom|textile|बुनकर|हथकरघा)/i.test(lower)) detectedOccupation = 'weaver';

  const isFemale = /(woman|female|girl|lady|महिला|लड़की|बहन|सिलाई)/i.test(lower);
  const isAbroad = /(abroad|foreign|usa|uk|canada|विदेश)/i.test(lower);
  const isPwd = detectedCategory === 'pwd' || /(pwd|divyang|disab|दिव्यांग)/i.test(lower);

  let detectedCity: string | null = null;
  const cityMatch = userText.match(/\b(delhi|new delhi|mumbai|bhopal|lucknow|bengaluru|bangalore|kolkata|jaipur|patna|hyderabad|pune|इंदौर|भोपाल|दिल्ली|लखनऊ|मुंबई|जयपुर|पटना)\b/i);
  if (cityMatch) {
    const raw = cityMatch[1].toLowerCase();
    if (raw.includes('delhi') || raw.includes('दिल्ली')) detectedCity = 'Delhi';
    else if (raw.includes('mumbai') || raw.includes('मुंबई')) detectedCity = 'Mumbai';
    else if (raw.includes('bhopal') || raw.includes('भोपाल')) detectedCity = 'Bhopal';
    else if (raw.includes('lucknow') || raw.includes('लखनऊ')) detectedCity = 'Lucknow';
    else if (raw.includes('bengaluru') || raw.includes('bangalore')) detectedCity = 'Bengaluru';
    else if (raw.includes('kolkata')) detectedCity = 'Kolkata';
    else if (raw.includes('jaipur') || raw.includes('जयपुर')) detectedCity = 'Jaipur';
    else if (raw.includes('patna') || raw.includes('पटना')) detectedCity = 'Patna';
    else if (raw.includes('hyderabad')) detectedCity = 'Hyderabad';
    else detectedCity = cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1);
  }

  return { detectedCategory, detectedPurpose, detectedCost, detectedIncome, detectedOccupation, detectedCity, isFemale, isAbroad, isPwd };
}

const GARBAGE_RESPONSE = {
  isConfident: false,
  purpose: null,
  projectCost: null,
  annualIncome: null,
  category: null,
  specialOccupation: 'none',
  isPwd: false,
  gender: 'male',
  educationLocation: 'india',
  missingFields: ['category', 'purpose', 'projectCost'],
  needsCategoryConfirmation: false,
  errorMessageEn: "We couldn't understand enough from your message. Please mention: your category, what you need funding for, and roughly how much you need.",
  errorMessageHi: "हम आपके संदेश से पर्याप्त जानकारी नहीं समझ सके। कृपया अपनी सामाजिक श्रेणी, आवश्यकता का उद्देश्य, और आवश्यक अनुमानित राशि बताएं।",
};

// ---------- parseSituation (direct Gemini call, same contract as /api/ai/parse-situation) ----------
export async function parseSituation(userText: string, language: string = 'en') {
  if (!userText || typeof userText !== 'string') {
    throw new Error('Text prompt is required');
  }

  if (detectGarbageInput(userText)) {
    return GARBAGE_RESPONSE;
  }

  if (!API_KEY) {
    // Same heuristic fallback path as server.ts when no key is configured
    const h = extractHeuristicParameters(userText);

    if (!h.detectedPurpose && !h.detectedCost && !h.detectedCategory) {
      return GARBAGE_RESPONSE;
    }

    if (!h.detectedCategory) {
      return {
        isConfident: true,
        purpose: h.detectedPurpose,
        projectCost: h.detectedCost,
        annualIncome: h.detectedIncome,
        category: null,
        specialOccupation: h.detectedOccupation,
        city: h.detectedCity,
        isPwd: h.isPwd,
        gender: h.isFemale ? 'female' : 'male',
        educationLocation: h.isAbroad ? 'abroad' : 'india',
        missingFields: ['category'],
        needsCategoryConfirmation: true,
        errorMessageEn: null,
        errorMessageHi: null,
        explanationEn: `We understood that you need ${h.detectedCost ? `₹${h.detectedCost.toLocaleString('en-IN')}` : 'funding'} for ${h.detectedPurpose || 'your project'}. Please confirm your beneficiary category before proceeding.`,
        explanationHi: `हमने समझा कि आपको ${h.detectedPurpose === 'education' ? 'शिक्षा' : 'परियोजना'} हेतु ${h.detectedCost ? `₹${h.detectedCost.toLocaleString('en-IN')}` : 'राशि'} की आवश्यकता है। आगे बढ़ने से पहले कृपया अपनी सामाजिक श्रेणी की पुष्टि करें।`,
      };
    }

    return {
      isConfident: true,
      purpose: h.detectedPurpose,
      projectCost: h.detectedCost,
      annualIncome: h.detectedIncome,
      category: h.detectedCategory,
      specialOccupation: h.detectedOccupation,
      city: h.detectedCity,
      isPwd: h.isPwd,
      gender: h.isFemale ? 'female' : 'male',
      educationLocation: h.isAbroad ? 'abroad' : 'india',
      missingFields: [],
      needsCategoryConfirmation: false,
      errorMessageEn: null,
      errorMessageHi: null,
      explanationEn: `We extracted your requirement of ₹${(h.detectedCost || 0).toLocaleString('en-IN')} for ${h.detectedPurpose} (${h.detectedCategory.toUpperCase()}). Ready for scheme matching.`,
      explanationHi: `₹${(h.detectedCost || 0).toLocaleString('en-IN')} (${h.detectedPurpose === 'education' ? 'शिक्षा' : 'व्यवसाय'}), श्रेणी: ${h.detectedCategory.toUpperCase()} निकाली गई। योजना मिलान हेतु तैयार।`,
    };
  }

  const systemInstruction = `You are a strict financial intake assistant for Nidhi Sahayak (SIH Problem Statement 26092, MoSJE).
Analyze user text and extract parameters ONLY if explicitly present.
CRITICAL RULES:
1. NEVER assume, invent, or default any field!
2. If text is gibberish, nonsensical, keyboard smash (e.g. "asdkjaskjd 12345 blah"), or test noise, set isConfident=false and set purpose=null, projectCost=null, annualIncome=null, category=null.
3. purpose: ONLY extract if stated: "education" for studies/college/degree/tuition; "business" for shops/trade/tailoring/retail; "agriculture" for farming/dairy; "sanitation" for sanitation work; "services" for transport/taxi/services; "other" for others. If not mentioned or unclear, return null.
4. projectCost: ONLY extract numerical amount/fee/cost/loan (e.g. 15 lakh -> 1500000, 20000 -> 20000). If not mentioned, return null.
5. annualIncome: ONLY extract if income is stated. If not mentioned, return null.
6. category: ONLY extract if mentioned: "sc", "st", "obc", "minority", "pwd", "ews", "general". DO NOT ASSUME OR DEFAULT TO SC. If not stated, return null.
7. specialOccupation: "street_vendor", "artisan", "safai_karamchari", "weaver", or "none".
8. isPwd: boolean (true if mentions disability/handicap/divyangjan).
9. gender: "female" if woman/female/girl; otherwise "male".
10. If category, purpose, or projectCost is missing, list them in missingFields.
11. If isConfident is false, set explanationEn to "We couldn't understand enough from your message. Please mention: your category, what you need funding for, and roughly how much you need." and Hindi in explanationHi.`;

  let parsed: any = {};
  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Parse this user situation description: "${userText}"` }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              isConfident: { type: 'BOOLEAN' },
              purpose: { type: 'STRING', nullable: true },
              projectCost: { type: 'NUMBER', nullable: true },
              annualIncome: { type: 'NUMBER', nullable: true },
              category: { type: 'STRING', nullable: true },
              specialOccupation: { type: 'STRING', nullable: true },
              city: { type: 'STRING', nullable: true },
              isPwd: { type: 'BOOLEAN', nullable: true },
              gender: { type: 'STRING', nullable: true },
              educationLocation: { type: 'STRING', nullable: true },
              missingFields: { type: 'ARRAY', items: { type: 'STRING' } },
              explanationEn: { type: 'STRING' },
              explanationHi: { type: 'STRING' },
            },
            required: ['isConfident', 'missingFields', 'explanationEn', 'explanationHi'],
          },
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error?.message || `AI_SERVICE_ERROR (${res.status})`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    parsed = JSON.parse(text.trim());
  } catch (error: any) {
    console.error('Error parsing situation with AI:', error);
    throw new Error(error?.message ? `AI_SERVICE_ERROR: ${error.message}` : 'AI_SERVICE_ERROR');
  }

  const validCategories = ['sc', 'st', 'obc', 'ews', 'general', 'minority', 'pwd'];
  const validOccupations = ['none', 'street_vendor', 'artisan', 'safai_karamchari', 'weaver'];
  const validPurposes = ['business', 'education', 'agriculture', 'sanitation', 'services', 'other'];

  const extractedCategory = validCategories.includes(parsed.category) ? parsed.category : null;
  const extractedPurpose = validPurposes.includes(parsed.purpose) ? parsed.purpose : null;
  const extractedCost = typeof parsed.projectCost === 'number' && parsed.projectCost > 0 ? parsed.projectCost : null;
  const extractedIncome = typeof parsed.annualIncome === 'number' && parsed.annualIncome >= 0 ? parsed.annualIncome : null;

  if (!parsed.isConfident || (!extractedPurpose && !extractedCost && !extractedCategory)) {
    return GARBAGE_RESPONSE;
  }

  const needsCategoryConfirmation = !extractedCategory;

  return {
    isConfident: true,
    purpose: extractedPurpose,
    projectCost: extractedCost,
    annualIncome: extractedIncome,
    category: extractedCategory,
    specialOccupation: validOccupations.includes(parsed.specialOccupation) ? parsed.specialOccupation : 'none',
    city: parsed.city || null,
    isPwd: Boolean(parsed.isPwd || extractedCategory === 'pwd'),
    gender: parsed.gender === 'female' ? 'female' : 'male',
    educationLocation: parsed.educationLocation === 'abroad' ? 'abroad' : 'india',
    missingFields: needsCategoryConfirmation ? ['category'] : [],
    needsCategoryConfirmation,
    errorMessageEn: null,
    errorMessageHi: null,
    explanationEn: parsed.explanationEn || (needsCategoryConfirmation
      ? 'Funding requirement detected. Please select your social category to proceed.'
      : 'Extracted details ready for scheme matching.'),
    explanationHi: parsed.explanationHi || (needsCategoryConfirmation
      ? 'आवश्यकता दर्ज की गई। आगे बढ़ने हेतु कृपया अपनी सामाजिक श्रेणी चुनें।'
      : 'निकाली गई जानकारी योजना मिलान हेतु तैयार है।'),
  };
}

// ---------- explainScheme (direct Gemini call, same contract as /api/ai/explain-scheme) ----------
export async function explainScheme(params: {
  schemeName: string;
  agency?: string;
  projectCost?: number;
  annualIncome?: number;
  userCategory?: string;
  language?: string;
}) {
  const {
    schemeName,
    agency = 'Government welfare agency',
    projectCost = 0,
    annualIncome = 0,
    userCategory = 'Beneficiary',
    language = 'en',
  } = params;

  if (!API_KEY) {
    return {
      explanation: language === 'hi'
        ? `यह योजना (${schemeName}) आपकी ₹${projectCost.toLocaleString('en-IN')} की आवश्यकता और ₹${annualIncome.toLocaleString('en-IN')} की पारिवारिक आय के लिए सबसे उपयुक्त है। इसमें रियायती ब्याज दर और प्रारंभिक मोरेटोरियम (छूट) उपलब्ध है।`
        : `This scheme (${schemeName}) is an optimal match for your project requirement of ₹${projectCost.toLocaleString('en-IN')} and annual family income of ₹${annualIncome.toLocaleString('en-IN')}. It features concessional interest terms and a structured moratorium period.`,
    };
  }

  const prompt = `Explain in warm, dignified, and encouraging ${language === 'hi' ? 'Hindi (Devanagari script)' : 'English'} why the national scheme "${schemeName}" offered by ${agency} is the ideal match for an applicant in category "${userCategory}" with project cost ₹${projectCost} and family annual income ₹${annualIncome}. Give 3 concise, practical next steps to prepare documents and approach the nearest Channel Partner (SCA, Public Sector Bank, RRB, or MFI). Keep the tone respectful and clear.`;

  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error?.message || `Failed (${res.status})`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return { explanation: text || 'Eligibility confirmed based on NSFDC norms.' };
  } catch (error: any) {
    console.error('Error explaining scheme:', error);
    throw new Error(error?.message || 'Failed to explain scheme');
  }
}