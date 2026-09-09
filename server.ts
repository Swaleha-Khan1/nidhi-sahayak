import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI client lazily & safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Route: Parse free-text user description into structured profile parameters
// Note: AI only parses text into variables. Strict rule logic decides eligibility.
app.post('/api/ai/parse-situation', async (req, res) => {
  try {
    const { userText, language = 'en' } = req.body;
    if (!userText || typeof userText !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback heuristics if API key is not yet configured
      const lower = userText.toLowerCase();
      let cost = 120000;
      let income = 200000;

      // Extract income if explicitly mentioned
      const incomeMatch = userText.match(/income\s*(?:is|of|:)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|l)/i) ||
                          userText.match(/आय\s*(?:है|:)?\s*(?:₹|रु\.?)?\s*(\d+(?:\.\d+)?)\s*(?:लाख)/i);
      if (incomeMatch) {
        income = Math.round(parseFloat(incomeMatch[1]) * 100000);
      }

      // Extract project cost / loan amount / course fee
      const costMatch = userText.match(/(?:cost|loan|need|require|amount|fee|fees|रुपये|लाख)\s*(?:of|is|:)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|l)/i) ||
                        userText.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|l)/i);
      if (costMatch) {
        cost = Math.round(parseFloat(costMatch[1]) * 100000);
      } else {
        const rawNum = userText.match(/₹?\s*(\d{4,8})/);
        if (rawNum) cost = parseInt(rawNum[1], 10);
      }

      const isEdu = lower.includes('education') || lower.includes('college') || lower.includes('study') || lower.includes('degree') || lower.includes('btech') || lower.includes('b.tech') || lower.includes('mba') || lower.includes('mbbs') || lower.includes('course') || lower.includes('fee') || lower.includes('शिक्षा') || lower.includes('पढ़ाई');
      const isAbroad = lower.includes('abroad') || lower.includes('foreign') || lower.includes('usa') || lower.includes('uk') || lower.includes('canada') || lower.includes('विदेश');
      const isFemale = lower.includes('woman') || lower.includes('female') || lower.includes('girl') || lower.includes('lady') || lower.includes('महिला') || lower.includes('लड़की') || lower.includes('बहन') || lower.includes('सिलाई');
      
      // Category detection
      let detectedCategory = 'sc';
      if (lower.includes('st ') || lower.includes('tribal') || lower.includes('scheduled tribe') || lower.includes('जनजाति') || lower.includes('आदिवासी')) {
        detectedCategory = 'st';
      } else if (lower.includes('obc') || lower.includes('backward class') || lower.includes('पिछड़ा वर्ग')) {
        detectedCategory = 'obc';
      } else if (lower.includes('ews') || lower.includes('economically weaker')) {
        detectedCategory = 'ews';
      } else if (lower.includes('minority') || lower.includes('muslim') || lower.includes('christian') || lower.includes('sikh') || lower.includes('buddhist') || lower.includes('jain') || lower.includes('अल्पसंख्यक')) {
        detectedCategory = 'minority';
      } else if (lower.includes('pwd') || lower.includes('disabled') || lower.includes('handicap') || lower.includes('divyang') || lower.includes('दिव्यांग')) {
        detectedCategory = 'pwd';
      } else if (lower.includes('general') || lower.includes('सामान्य')) {
        detectedCategory = 'general';
      }

      // Special occupation detection
      let detectedOccupation = 'none';
      if (lower.includes('vendor') || lower.includes('hawker') || lower.includes('street') || lower.includes('रेहड़ी') || lower.includes('ठेला') || lower.includes('फेरी')) {
        detectedOccupation = 'street_vendor';
      } else if (lower.includes('artisan') || lower.includes('craft') || lower.includes('vishwakarma') || lower.includes('carpenter') || lower.includes('blacksmith') || lower.includes('विश्वकर्मा') || lower.includes('कारीगर') || lower.includes('शिल्पकार')) {
        detectedOccupation = 'artisan';
      } else if (lower.includes('sanitation') || lower.includes('safai') || lower.includes('scavenger') || lower.includes('सफाई कर्मचारी') || lower.includes('स्वच्छता')) {
        detectedOccupation = 'safai_karamchari';
      } else if (lower.includes('weaver') || lower.includes('handloom') || lower.includes('textile') || lower.includes('बुनकर') || lower.includes('हथकरघा')) {
        detectedOccupation = 'weaver';
      }

      return res.json({
        purpose: isEdu ? 'education' : (detectedOccupation === 'sanitation' ? 'sanitation' : 'business'),
        projectCost: cost,
        annualIncome: income,
        category: detectedCategory,
        specialOccupation: detectedOccupation,
        isPwd: detectedCategory === 'pwd' || lower.includes('divyang') || lower.includes('disab'),
        gender: isFemale ? 'female' : 'male',
        educationLocation: isAbroad ? 'abroad' : 'india',
        explanationEn: `We understood that you need approximately ₹${cost.toLocaleString('en-IN')} for your ${isEdu ? 'course fee/education loan' : 'business venture'}. We have extracted your financial profile and mapped to verified national welfare schemes.`,
        explanationHi: `हमने समझा कि आपको अपने ${isEdu ? 'शिक्षा ऋण / पाठ्यक्रम शुल्क' : 'व्यवसाय'} हेतु लगभग ₹${cost.toLocaleString('en-IN')} की आवश्यकता है। हमने राष्ट्रीय योजनाओं के अनुसार आपका विवरण तैयार कर दिया है।`,
      });
    }

    const systemInstruction = `You are an expert financial intake assistant for Nidhi Sahayak, an AI-driven scheme matching platform for Indian marginalized and inclusive entrepreneurs (SIH Problem Statement 26092, MoSJE).
Your task is to extract structured financial parameters from the user's free-text description in English, Hindi, or Hinglish.
Return JSON with the exact fields:
- purpose: "education" if user mentions any study, degree, college, course fee, tuition, B.Tech, MBA, MBBS, MS, schooling, university; "business" for shops, retail, enterprise, tailoring, manufacturing; "agriculture" for farming/dairy; "sanitation" for sanitation work/equipment; "services" for passenger transport/service center; "other" for others.
- projectCost: number in INR representing the total required loan amount, project cost, or course fee (e.g., if user mentions 15 lakh, return 1500000; if 1.2 lakh, return 120000; if 3.5 lakh, return 350000; if 50 thousand, return 50000).
- annualIncome: number in INR representing annual family income (e.g. if user mentions family income 2.5 lakh, return 250000; default to 200000 if not stated).
- category: one of "sc", "st", "obc", "ews", "general", "minority", "pwd" (default "sc" if unspecified or if user mentions Scheduled Caste; set "st" for Scheduled Tribe; "obc" for Backward Classes; "minority" for Muslim, Christian, Sikh, Buddhist, Jain, Parsi; "pwd" for Persons with Disabilities/Divyangjan; "ews" for economically weaker; "general" for general category).
- specialOccupation: one of "none", "street_vendor", "artisan", "safai_karamchari", "weaver" (set "street_vendor" for street vendors/hawkers/thela/rehri; "artisan" for traditional craftsmen/Vishwakarma/carpenter/blacksmith/potter; "safai_karamchari" for sanitation workers/scavengers; "weaver" for handloom weavers; otherwise "none").
- isPwd: boolean (true if user mentions disability, handicap, or divyangjan).
- gender: "male" | "female" | "other" (set "female" if user mentions woman, female, girl, sister, mother, or female pronouns; otherwise "male").
- educationLocation: "abroad" if foreign country, abroad, USA, UK, etc. is mentioned; otherwise "india".
- explanationEn: a concise, warm 2-sentence explanation of what was extracted (including whether it's Course Fee for education or Project Cost for business) and how it maps to national credit schemes.
- explanationHi: a concise, warm 2-sentence explanation in Devanagari Hindi.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Parse this user situation description: "${userText}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            purpose: { type: Type.STRING },
            projectCost: { type: Type.NUMBER },
            annualIncome: { type: Type.NUMBER },
            category: { type: Type.STRING },
            specialOccupation: { type: Type.STRING },
            isPwd: { type: Type.BOOLEAN },
            gender: { type: Type.STRING },
            educationLocation: { type: Type.STRING },
            explanationEn: { type: Type.STRING },
            explanationHi: { type: Type.STRING },
          },
          required: ['purpose', 'projectCost', 'annualIncome', 'category', 'gender', 'explanationEn', 'explanationHi'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const validCategories = ['sc', 'st', 'obc', 'ews', 'general', 'minority', 'pwd'];
    const validOccupations = ['none', 'street_vendor', 'artisan', 'safai_karamchari', 'weaver'];

    return res.json({
      purpose: parsed.purpose || 'business',
      projectCost: typeof parsed.projectCost === 'number' ? parsed.projectCost : 120000,
      annualIncome: typeof parsed.annualIncome === 'number' ? parsed.annualIncome : 200000,
      category: validCategories.includes(parsed.category) ? parsed.category : 'sc',
      specialOccupation: validOccupations.includes(parsed.specialOccupation) ? parsed.specialOccupation : 'none',
      isPwd: Boolean(parsed.isPwd),
      gender: parsed.gender || 'male',
      educationLocation: parsed.educationLocation || 'india',
      explanationEn: parsed.explanationEn || 'Extracted details ready for scheme matching.',
      explanationHi: parsed.explanationHi || 'निकाली गई जानकारी योजना मिलान हेतु तैयार है।',
    });
  } catch (error: any) {
    console.error('Error parsing situation:', error);
    return res.status(500).json({ error: error.message || 'Failed to parse situation' });
  }
});

// API Route: Explain scheme match in natural language
app.post('/api/ai/explain-scheme', async (req, res) => {
  try {
    const { schemeName, agency, projectCost, annualIncome, userCategory, language = 'en', category } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        explanation: language === 'hi'
          ? `यह योजना (${schemeName}) आपकी ₹${(projectCost || 0).toLocaleString('en-IN')} की आवश्यकता और ₹${(annualIncome || 0).toLocaleString('en-IN')} की पारिवारिक आय के लिए सबसे उपयुक्त है। इसमें रियायती ब्याज दर और प्रारंभिक मोरेटोरियम (छूट) उपलब्ध है।`
          : `This scheme (${schemeName}) is an optimal match for your project requirement of ₹${(projectCost || 0).toLocaleString('en-IN')} and annual family income of ₹${(annualIncome || 0).toLocaleString('en-IN')}. It features concessional interest terms and a structured moratorium period.`,
      });
    }

    const prompt = `Explain in warm, dignified, and encouraging ${language === 'hi' ? 'Hindi (Devanagari script)' : 'English'} why the national scheme "${schemeName}" offered by ${agency || 'Government welfare agency'} is the ideal match for an applicant in category "${userCategory || 'Beneficiary'}" with project cost ₹${projectCost} and family annual income ₹${annualIncome}. Give 3 concise, practical next steps to prepare documents and approach the nearest Channel Partner (SCA, Public Sector Bank, RRB, or MFI). Keep the tone respectful and clear.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return res.json({
      explanation: response.text?.trim() || 'Eligibility confirmed based on NSFDC norms.',
    });
  } catch (error: any) {
    console.error('Error explaining scheme:', error);
    return res.status(500).json({ error: error.message || 'Failed to explain scheme' });
  }
});

// Start Express and integrate Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nidhi Sahayak server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
