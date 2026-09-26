import { Partner } from '../types';

export const PARTNERS_METADATA = {
  purpose: 'Verified replacement data for src/data/partners.ts CHANNEL_PARTNERS in the Nidhi Sahayak app',
  source_name: 'Ministry of Social Justice & Empowerment (MoSJE) — List of Channelizing Agencies',
  source_url: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  fetched_on: '2026-09-24',
  coverage_note:
    "This is the MoSJE-published list of State Channelizing Agencies (SCAs), Regional Rural Banks (RRBs), and select Nationalised Banks. It is NOT confirmed to be NSFDC-specific — it appears under the NSKFDC section of the portal but lists agencies used broadly across SC/ST/OBC welfare corporations. Verify against NSFDC's own published SCA list (nsfdc.nic.in) before presenting this as NSFDC-specific if that matters for your demo.",
  known_source_issues: [
    "UP SCFDC entry's address pincode is printed as 266006 in the source page; Mahanagar, Lucknow's actual PIN is 226006. Likely a typo on the government page itself, not corrected here — verify before use.",
    'No Telangana-specific SCA was listed on this page; only an RRB entry is available for Hyderabad.',
    'Phone numbers and emails are head-office contacts, not branch-level. Some government contact numbers go stale — recommend a spot-check call/email before a live demo if possible.',
    'No coordinates included. Do not fabricate lat/lng — geocode these addresses yourself if you need map pins.',
  ],
};

export const VERIFIED_CITIES = [
  'Delhi',
  'Bhopal',
  'Mumbai',
  'Lucknow',
  'Bengaluru',
  'Kolkata',
  'Jaipur',
  'Patna',
  'Hyderabad',
];

export const SAMPLE_CITIES = VERIFIED_CITIES;

export const CHANNEL_PARTNERS: Partner[] = [
  {
    id: 'delhi-sca',
    agencyName: 'Delhi SC, ST, OBC, Minorities, Physical Handicapped Financial and Development Corporation (DSFDC)',
    agencyType: 'SCA',
    state: 'Delhi',
    city: 'Delhi',
    address: 'Ambedkar Bhawan, Institutional Area, Sector 16, Rohini - 110085',
    phone: ['011-27574377', '011-27574321'],
    fax: '011-27572706',
    email: ['dsfdcplanning@gmail.com', 'dsfdcdelhi@gmail.com', 'scstdepartment@gmail.com'],
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'delhi-nationalised-bank',
    agencyName: 'Indian Overseas Bank — Preet Vihar Branch',
    agencyType: 'Nationalised Bank',
    state: 'Delhi',
    city: 'Delhi',
    address: 'A-172, Preet Vihar, Delhi - 110092',
    phone: ['011-22524928', '011-22043882', '011-22521207'],
    fax: '011-22043882',
    email: ['preetbr@delsco.iobnet.co.in', 'iob1305@iob.in'],
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'bhopal-sca',
    agencyName: 'Madhya Pradesh State Cooperative SC Development Corporation',
    agencyType: 'SCA',
    state: 'Madhya Pradesh',
    city: 'Bhopal',
    address: 'Rajiv Gandhi Bhawan, 35 Shyamala Hills, Bhopal - 462002',
    phone: ['0755-2661744', '0755-2661844'],
    fax: '0755-2661612',
    email: ['mpscfdc@gmail.com', 'mpscfdc@mp.gov.in'],
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'mp-rrb',
    agencyName: 'Madhya Pradesh Gramin Bank (sponsored by State Bank of India)',
    agencyType: 'RRB',
    state: 'Madhya Pradesh',
    city: 'Indore',
    address: 'C21 Business Park, MR-10, Indore - 452010',
    phone: ['0731-2445333'],
    email: ['ho.indore@mpgb-rrb.com'],
    website: 'https://www.mgbank.co.in/',
    note: 'Head office is in Indore, not Bhopal — this is the state-level RRB, not a Bhopal branch specifically.',
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'mumbai-sca',
    agencyName: 'Mahatma Phule Backward Class Development Corporation Ltd.',
    agencyType: 'SCA',
    state: 'Maharashtra',
    city: 'Mumbai',
    address: 'N-1, Juhu Supreme Shopping Centre, Gulmohar Cross Road No. 9, J.V.P.D. Scheme, Juhu, Mumbai - 400049',
    phone: ['022-26200351', '022-26202852'],
    fax: '022-26705173',
    email: ['md.mpbcdc@gmail.com', 'mahatma.phule@gmail.com'],
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'mumbai-nationalised-bank',
    agencyName: 'Central Bank of India — Head Office',
    agencyType: 'Nationalised Bank',
    state: 'Maharashtra',
    city: 'Mumbai',
    address: 'Chander Mukhi, Nariman Point, Mumbai - 400021',
    phone: ['022-66387777'],
    email: ['info@centralbankofindia.co.in', 'dgmgbdelhi@centralbank.co.in'],
    website: 'https://www.centralbank.bank.in/en',
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'lucknow-sca',
    agencyName: 'U.P. Scheduled Castes Finance & Development Corporation',
    agencyType: 'SCA',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    address: 'B-912, Sector C, Mahanagar, Lucknow - 226006 (source page prints 266006, likely a typo — verify before use)',
    phone: ['0522-2322085', '0522-2335347'],
    fax: '0522-2334689',
    email: ['md.hqupscfdc@gmail.com', 'gm.hq.upsfdc@gmail.com', 'monitor.hq.upsfdc@gmail.com'],
    note: "Official source page prints pincode as 266006; Mahanagar, Lucknow's actual PIN is 226006. Likely a government typo — verify before visiting.",
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'bengaluru-sca',
    agencyName: 'Karnataka State Safai Karmachari Development Corporation (KSSKDC)',
    agencyType: 'SCA',
    state: 'Karnataka',
    city: 'Bengaluru',
    address: 'Saira Bagh No. 19/4, 3rd Floor, Cunningham Road, Bengaluru - 560052',
    phone: ['080-22212202', '080-22868870', '080-22867097'],
    fax: '080-22860396',
    email: ['ksskdc3@gmail.com'],
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'bengaluru-nationalised-bank',
    agencyName: 'Canara Bank — Head Office (Priority Credit Wing)',
    agencyType: 'Nationalised Bank',
    state: 'Karnataka',
    city: 'Bengaluru',
    address: '112, J.C. Road, Bangalore - 560002',
    phone: ['080-22110557'],
    email: ['hopcs@canarabank.com', 'pcccodel@canarabank.com'],
    website: 'https://www.canarabank.com',
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'kolkata-sca',
    agencyName: 'West Bengal Scheduled Castes and Scheduled Tribes Development and Finance Corporation',
    agencyType: 'SCA',
    state: 'West Bengal',
    city: 'Kolkata',
    address: 'CF-217/A/1, Sector-I, Salt Lake, Kolkata - 700064',
    phone: ['033-40261500', '033-40261505', '033-40261506', '033-40261509'],
    fax: '033-40051233',
    email: ['wbscstdfc@gmail.com', 'md.scstdfc@gmail.com'],
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'jaipur-sca',
    agencyName: 'Rajasthan SC & ST Finance & Development Cooperative Corporation Ltd.',
    agencyType: 'SCA',
    state: 'Rajasthan',
    city: 'Jaipur',
    address: 'Nehru Sahkar Bhawan, Central Block, 3rd Floor, Bhawani Singh Road, Jaipur - 302005',
    phone: ['0141-2740833', '0141-2740544', '0141-2740745', '0141-2741328'],
    fax: '0141-2740880',
    email: ['gmscdcho@gmail.com'],
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'patna-sca',
    agencyName: 'Bihar State Scheduled Castes Cooperative Development Corporation Ltd.',
    agencyType: 'SCA',
    state: 'Bihar',
    city: 'Patna',
    address: 'Officers Flat 35/84, 2nd Floor, New Punaichak, Patna - 800023',
    phone: ['0612-2525612'],
    email: ['bssccdc@yahoo.com', 'directorscst@gmail.com'],
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
  {
    id: 'hyderabad-rrb',
    agencyName: 'Telangana Grameena Bank (sponsored by State Bank of India)',
    agencyType: 'RRB',
    state: 'Telangana',
    city: 'Hyderabad',
    address: 'Nallakunta, Hyderabad - 500044',
    phone: ['040-23232107'],
    fax: '040-27662623',
    email: ['tgbho@tgbhyd.in'],
    note: 'No SCA was listed for Telangana on the official portal — this RRB is the only verified entry available for Hyderabad.',
    corporationsCovered: 'unconfirmed',
    dataSource: 'verified',
    sourceReference: 'https://devmosje.negd.in/organisation/list-of-channelizing-agencies/',
  },
];

export interface LocationPartnersResult {
  partners: Partner[];
  isLocationSet: boolean;
  matchedCity: string | null;
  hasVerifiedData: boolean;
  searchedCity?: string;
}

/**
 * Resolves verified partners for a given city/location string.
 * Strictly does NOT invent or fabricate entries for other cities.
 * If location is empty, returns all verified entries for user browsing.
 * If city is not found among verified cities, returns empty list with hasVerifiedData=false.
 */
export function getSamplePartnersForLocation(userCity?: string | null): LocationPartnersResult {
  const raw = (userCity || '').trim();

  // If location is unset or empty: return all 13 verified partners
  if (!raw) {
    return {
      partners: CHANNEL_PARTNERS,
      isLocationSet: false,
      matchedCity: null,
      hasVerifiedData: true,
    };
  }

  const lower = raw.toLowerCase();
  let matchedCityName: string | null = null;

  if (lower.includes('delhi') || lower.includes('ncr') || lower.includes('दिल्ली')) {
    matchedCityName = 'Delhi';
  } else if (
    lower.includes('bhopal') ||
    lower.includes('भोपाल') ||
    lower.includes('madhya pradesh') ||
    lower.includes('mp') ||
    lower.includes('indore') ||
    lower.includes('इंदौर')
  ) {
    matchedCityName = 'Bhopal';
  } else if (lower.includes('mumbai') || lower.includes('bombay') || lower.includes('मुंबई') || lower.includes('maharashtra')) {
    matchedCityName = 'Mumbai';
  } else if (lower.includes('lucknow') || lower.includes('लखनऊ') || lower.includes('uttar pradesh') || lower.includes('up')) {
    matchedCityName = 'Lucknow';
  } else if (lower.includes('bengaluru') || lower.includes('bangalore') || lower.includes('बेंगलुरु') || lower.includes('karnataka')) {
    matchedCityName = 'Bengaluru';
  } else if (lower.includes('jaipur') || lower.includes('जयपुर') || lower.includes('rajasthan')) {
    matchedCityName = 'Jaipur';
  } else if (lower.includes('patna') || lower.includes('पटना') || lower.includes('bihar')) {
    matchedCityName = 'Patna';
  } else if (lower.includes('kolkata') || lower.includes('calcutta') || lower.includes('कोलकाता') || lower.includes('west bengal')) {
    matchedCityName = 'Kolkata';
  } else if (
    lower.includes('hyderabad') ||
    lower.includes('हैदराबाद') ||
    lower.includes('telangana') ||
    lower.includes('secunderabad')
  ) {
    matchedCityName = 'Hyderabad';
  }

  if (matchedCityName) {
    let cityPartners = CHANNEL_PARTNERS.filter((p) => p.city.toLowerCase() === matchedCityName!.toLowerCase());
    // For Bhopal, include MP Gramin Bank (state-level RRB based in Indore)
    if (matchedCityName === 'Bhopal') {
      const mpRrb = CHANNEL_PARTNERS.find((p) => p.id === 'mp-rrb');
      if (mpRrb && !cityPartners.some((p) => p.id === 'mp-rrb')) {
        cityPartners = [...cityPartners, mpRrb];
      }
    }
    return {
      partners: cityPartners,
      isLocationSet: true,
      matchedCity: matchedCityName,
      hasVerifiedData: cityPartners.length > 0,
      searchedCity: raw,
    };
  }

  // Not matched to any verified city: DO NOT fabricate entries!
  return {
    partners: [],
    isLocationSet: true,
    matchedCity: null,
    hasVerifiedData: false,
    searchedCity: raw,
  };
}
