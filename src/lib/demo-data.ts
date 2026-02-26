// =============================================================================
// Demo Data for Relay - Fintech SaaS (Wealthsimple-style)
// =============================================================================
// This file contains deterministic, hardcoded demo data for 2000 accounts
// across 5 segments with realistic company names, contacts, transitions,
// activities, briefs, and emails.
// =============================================================================

import type {
  Organization,
  User,
  Account,
  AccountContact,
  Transition,
  TransitionBrief,
  TransitionEmail,
  TransitionActivity,
  AssignmentRule,
  AccountSegment,
  AccountSubSegment,
  DashboardMetrics,
  PipelineItem,
  RepWorkload,
} from '@/types'

// ---------------------------------------------------------------------------
// Seeded PRNG - deterministic data generation
// ---------------------------------------------------------------------------
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function pickIndex(length: number, rand: () => number): number {
  return Math.floor(rand() * length)
}

function rangeInt(min: number, max: number, rand: () => number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

function padNum(n: number, digits: number): string {
  return String(n).padStart(digits, '0')
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${padNum(month, 2)}-${padNum(day, 2)}`
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------
export const demoOrg: Organization = {
  id: 'org-1',
  name: 'Wealthsimple',
  slug: 'wealthsimple',
  logo_url: null,
  settings: { default_capacity: 400, auto_assign: true, brief_auto_generate: true },
  created_at: '2024-01-01',
}

// ---------------------------------------------------------------------------
// Team Members
// ---------------------------------------------------------------------------
export const demoTeamMembers: User[] = [
  { id: 'user-1', full_name: 'Sarah Chen', email: 'sarah.chen@wealthsimple.com', role: 'admin' as const, capacity: 0, specialties: ['Enterprise', 'FINS'], calendar_link: null, avatar_url: null, org_id: 'org-1', created_at: '2024-01-15' },
  { id: 'user-2', full_name: 'Marcus Johnson', email: 'marcus.j@wealthsimple.com', role: 'manager' as const, capacity: 50, specialties: ['Corporate', 'Enterprise'], calendar_link: 'https://cal.com/marcus-j', avatar_url: null, org_id: 'org-1', created_at: '2024-02-01' },
  { id: 'user-3', full_name: 'Elena Rodriguez', email: 'elena.r@wealthsimple.com', role: 'rep' as const, capacity: 400, specialties: ['Commercial', 'Corporate'], calendar_link: 'https://cal.com/elena-r', avatar_url: null, org_id: 'org-1', created_at: '2024-03-01' },
  { id: 'user-4', full_name: 'David Kim', email: 'david.k@wealthsimple.com', role: 'rep' as const, capacity: 350, specialties: ['FINS', 'Enterprise'], calendar_link: 'https://cal.com/david-k', avatar_url: null, org_id: 'org-1', created_at: '2024-04-01' },
  { id: 'user-5', full_name: 'Priya Patel', email: 'priya.p@wealthsimple.com', role: 'rep' as const, capacity: 400, specialties: ['Commercial', 'International'], calendar_link: 'https://cal.com/priya-p', avatar_url: null, org_id: 'org-1', created_at: '2024-05-01' },
  { id: 'user-6', full_name: 'James O\'Brien', email: 'james.o@wealthsimple.com', role: 'rep' as const, capacity: 400, specialties: ['Corporate', 'FINS'], calendar_link: 'https://cal.com/james-o', avatar_url: null, org_id: 'org-1', created_at: '2024-06-01' },
]

// ---------------------------------------------------------------------------
// Name generation pools
// ---------------------------------------------------------------------------

// Commercial / Corporate / Enterprise company name parts
const companyPrefixes = [
  'North', 'South', 'East', 'West', 'Pacific', 'Atlantic', 'Central', 'Prime',
  'Apex', 'Summit', 'Pinnacle', 'Horizon', 'Frontier', 'Nova', 'Vanguard',
  'Sterling', 'Cascade', 'Meridian', 'Vertex', 'Zenith', 'Crest', 'Peak',
  'Beacon', 'Bridge', 'Keystone', 'Mosaic', 'Ember', 'Onyx', 'Cedar',
  'Maple', 'Iron', 'Steel', 'Copper', 'Silver', 'Golden', 'Blue', 'Red',
  'Green', 'True', 'Core', 'Next', 'Clear', 'Bright', 'Swift', 'Bold',
  'Alpine', 'Harbor', 'Timber', 'Ridge', 'River', 'Lake', 'Prairie', 'Canyon',
  'Granite', 'Aspen', 'Birch', 'Spruce', 'Falcon', 'Eagle', 'Osprey', 'Orca',
  'Kodiak', 'Lynx', 'Fox', 'Wolf', 'Bison', 'Elk', 'Raven', 'Hawk',
  'Polar', 'Aurora', 'Boreal', 'Tundra', 'Arctic', 'Coral', 'Reef', 'Terra',
]

const companySuffixes = [
  'Technologies', 'Solutions', 'Systems', 'Group', 'Labs', 'Digital',
  'Dynamics', 'Innovations', 'Analytics', 'Ventures', 'Partners',
  'Industries', 'Networks', 'Software', 'Services', 'Consulting',
  'Robotics', 'Logistics', 'Media', 'Health', 'Bio', 'Energy',
  'Cloud', 'Data', 'AI', 'Security', 'Capital', 'Works',
  'Platforms', 'Commerce', 'Payments', 'Financial', 'Fintech', 'Proptech',
  'Automation', 'Intelligence', 'Engineering', 'Manufacturing', 'Enterprises',
]

const standaloneCompanyNames = [
  'Lightspeed Commerce', 'Shopify Plus', 'Coveo Solutions', 'Dialogue Health',
  'Clearco', 'Borrowell', 'Koho Financial', 'Nuvei Corporation',
  'Kinaxis', 'Dapper Labs', 'Hootsuite', 'Freshii',
  'Skip the Dishes', 'Article Furniture', 'Ritual', 'TouchBistro',
  'Thinkific', 'Clio Legal', 'Benevity', 'Jobber',
  'Absorb Software', 'Solace Systems', 'PointClickCare', 'Pivotal Software',
  'MindBridge Analytics', 'Vendasta Technologies', 'Questrade',
  'Wave Financial', 'FreshBooks', 'Clearbanc',
  'Neo Financial', 'Trulioo', 'Certn', 'Procurify',
  'Vena Solutions', 'Tulip Retail', 'Greenfield Global', 'Miovision',
  'Geotab', 'Magnet Forensics', 'D2L', 'OpenText',
  'Descartes Systems', 'Constellation Software', 'CGI Group',
  'MDA Corporation', 'BlackBerry', 'Telus Digital',
  'Docebo', 'Payfare', 'Nuvei', 'Converge Technology',
  'Calian Group', 'Altus Group', 'Hatch Engineering',
  'Stantec', 'WSP Global', 'Aecon Group', 'SNC-Lavalin',
  'Toromont Industries', 'Finning International', 'BRP',
  'Bombardier', 'CAE', 'Linamar Corporation',
  'Magna International', 'Martinrea International', 'Celestica',
  'Thomson Reuters', 'Manulife', 'Power Corporation',
  'Fairfax Financial', 'Brookfield Asset Management',
  'Saputo', 'Metro', 'Alimentation Couche-Tard',
  'Dollarama', 'Canadian Tire Corporation', 'Empire Company',
  'George Weston', 'Loblaw Companies', 'Restaurant Brands International',
  'Rogers Communications', 'BCE Inc', 'Shaw Communications',
  'Pason Systems', 'Tervita', 'Parkland Fuel',
  'Gibson Energy', 'Inter Pipeline', 'Pembina Pipeline',
  'Husky Energy', 'Arc Resources', 'Vermilion Energy',
  'Precision Drilling', 'Trican Well Service', 'CES Energy Solutions',
  'Eldorado Gold', 'Lundin Mining', 'Teck Resources',
  'Agnico Eagle Mines', 'Kinross Gold', 'First Quantum Minerals',
  'Franco-Nevada', 'Wheaton Precious Metals',
  'Canopy Growth', 'Tilray Brands', 'Cronos Group',
  'Spin Master', 'Canada Goose', 'Lululemon',
  'Aritzia', 'Roots', 'MEC', 'La Maison Simons',
  'Mountain Equipment', 'Leon Furniture', 'Sleep Country',
  'Indigo Books', 'Cineplex', 'Corus Entertainment',
  'Torstar', 'Postmedia', 'Cossette Communications',
  'Critical Mass', 'Sid Lee', 'Zeno Group Canada',
]

// Enterprise-specific large company names
const enterpriseCompanyNames = [
  'Suncor Energy', 'Enbridge', 'TC Energy', 'Canadian National Railway', 'Canadian Pacific Kansas City',
  'Nutrien', 'Barrick Gold', 'Shopify', 'Royal Bank of Canada', 'Toronto-Dominion Bank',
  'Bank of Nova Scotia', 'Bank of Montreal', 'CIBC', 'Great-West Lifeco', 'Power Corporation of Canada',
  'Fortis Inc', 'Emera', 'TransAlta', 'Cameco', 'Teck Resources',
  'Imperial Oil', 'Husky Energy', 'Cenovus Energy', 'MEG Energy', 'Vermilion Energy',
  'Agnico Eagle Mines', 'First Quantum Minerals', 'Lundin Mining', 'Kinross Gold', 'Eldorado Gold',
  'Loblaw Companies', 'George Weston', 'Empire Company', 'Metro Inc', 'Dollarama',
  'Canadian Tire', 'Couche-Tard', 'Restaurant Brands', 'Tim Hortons', 'Jean Coutu Group',
  'Sun Life Assurance', 'Manulife Financial', 'Intact Financial Corp', 'Fairfax Financial Holdings', 'iA Financial',
  'BCE Inc Telecom', 'Rogers Wireless', 'Telus Communications', 'Shaw Telecom', 'Quebecor',
  'Air Canada', 'WestJet Airlines', 'Porter Aviation', 'Bombardier Aerospace', 'CAE Aviation',
  'SNC-Lavalin Engineering', 'WSP Global Engineering', 'Stantec Engineering', 'Aecon Construction', 'EllisDon',
  'PCL Construction', 'Graham Group', 'Bird Construction', 'Ledcor Group', 'Pomerleau',
  'Saputo Dairy', 'Maple Leaf Foods', 'Premium Brands Holdings', 'Agropur Cooperative', 'Lassonde Industries',
  'Thomson Reuters Corp', 'CGI Group Inc', 'OpenText Corporation', 'Constellation Software Inc', 'Descartes Systems Group',
  'Celestica Inc', 'Magna International Inc', 'Linamar Corporation Inc', 'Martinrea Intl', 'ABC Technologies',
  'BRP Inc', 'Toromont Industries', 'Finning International Inc', 'Ritchie Bros Auctioneers', 'Wajax Corporation',
  'Franco-Nevada Corp', 'Wheaton Precious Metals Corp', 'Osisko Gold Royalties', 'Sandstorm Gold', 'Royal Gold Canada',
  'Brookfield Infrastructure', 'Brookfield Renewable', 'Brookfield Business Partners', 'Brookfield Reinsurance', 'Brookfield Property',
  'Allied Properties Corp', 'RioCan Real Estate', 'SmartCentres Corp', 'Canadian Apartment REIT', 'Dream Industrial',
  'Northland Power', 'Capital Power', 'Algonquin Power', 'Innergex Renewable', 'Boralex',
  'Telus International', 'Lightspeed Commerce Inc', 'Dye & Durham', 'Copperleaf Technologies', 'Coveo Solutions Inc',
  'Docebo Learning', 'Kinaxis Inc', 'Enghouse Systems', 'Calian Group Inc', 'Converge Technology Solutions',
  'Nuvei Corp', 'Payfare Inc', 'Mogo Inc', 'Propel Holdings', 'ECN Capital',
  'Definity Insurance', 'Trisura Group', 'Sagicor Financial', 'E-L Financial', 'Economical Mutual Insurance',
  'Precision Drilling Corp', 'Trican Well Service Ltd', 'CES Energy Solutions Ltd', 'Pason Systems Inc', 'Cathedral Energy',
  'Gibson Energy Inc', 'Inter Pipeline Ltd', 'Pembina Pipeline Corp', 'Keyera Corp', 'AltaGas',
  'Canada Goose Holdings', 'Aritzia Inc', 'Lululemon Athletica', 'Roots Corp', 'Spin Master Corp',
  'Canopy Growth Corp', 'Tilray Brands Inc', 'Cronos Group Inc', 'OrganiGram Holdings', 'HEXO Corp',
  'MDA Space', 'Heroux-Devtek', 'Magellan Aerospace', 'IMP Aerospace', 'Viking Air',
  'Stars Group', 'Pollard Banknote', 'Loto-Quebec', 'OLG', 'Gateway Casinos',
  'Cineplex Entertainment', 'Corus Media', 'DHX Media', 'Entertainment One', 'WildBrain',
  'Granite REIT Corp', 'WPT Industrial REIT', 'Summit Industrial REIT', 'Artis REIT Corp', 'Melcor Developments',
  'First Capital REIT', 'CT REIT', 'Crombie REIT', 'Choice Properties REIT', 'Killam Apartment REIT',
  'Element Fleet Management', 'Autocanada', 'Park Lawn', 'Premium Brands', 'Boyd Group Services',
  'Colliers International Group', 'FirstService Corp', 'Paladin Security', 'GardaWorld', 'Securitas Canada',
  'CBRE Group Canada', 'JLL Canada Inc', 'Avison Young Corp', 'Cushman Wakefield Canada', 'Altus Group Inc',
  'Hatch Engineering Inc', 'Jacobs Engineering Canada', 'AECOM Canada', 'Arcadis Canada', 'Mott MacDonald Canada',
  'Sobeys National', 'Costco Canada', 'Walmart Canada', 'Target Canada Operations', 'Home Depot Canada',
  'Lowe\'s Canada', 'Rona Inc', 'Home Hardware', 'Princess Auto', 'Peavey Industries',
  'Irving Oil', 'Husky Marketing', 'Suncor Retail', 'Parkland Fuel Corp', 'Federated Co-op',
  'Purolator', 'Canada Post Corp', 'FedEx Canada', 'UPS Canada', 'DHL Express Canada',
  'Telus Health', 'WELL Health Technologies', 'CareRx Corp', 'Dialogue Health Technologies', 'CloudMD Software',
  'Ballard Power Systems', 'Loop Energy', 'Westport Fuel Systems', 'GreenPower Motor', 'Lion Electric',
  'Blackberry QNX', 'Absolute Software', 'Magnet Forensics Corp', 'eSentire', 'Arctic Wolf Networks',
  'Miovision Technologies', 'Geotab Inc', 'Mojio', 'Derive Systems', 'Piaggio Fast Forward',
  'D2L Corporation', 'Top Hat', 'ApplyBoard', 'Clearco Capital', 'FreshBooks Cloud Accounting',
  'Wave Financial Inc', 'TouchBistro Inc', 'Lightspeed Restaurant', 'Nuvei Payments', 'Square Canada',
]

// US standalone company names
const usCompanyNames = [
  'Stripe', 'Plaid', 'Brex', 'Ramp', 'Mercury Financial',
  'Marqeta', 'Affirm', 'Divvy', 'Carta', 'Gusto',
  'Rippling', 'Deel', 'Remote', 'Lattice', 'Culture Amp',
  'Lever', 'Greenhouse Software', 'BambooHR', 'Namely', 'Paylocity',
  'Workday', 'Zuora', 'Coupa Software', 'Avalara', 'Bill.com',
  'Tipalti', 'MeridianLink', 'nCino', 'Blend Labs', 'Blend',
  'Toast', 'Square', 'Clover Network', 'Lightspeed POS',
  'Verifone', 'Poynt', 'SpotOn', 'Olo',
  'Datadog', 'Snowflake', 'HashiCorp', 'Confluent',
  'MongoDB', 'Elastic', 'Sumo Logic', 'New Relic',
  'PagerDuty', 'Splunk', 'Dynatrace', 'AppDynamics',
  'Twilio', 'SendGrid', 'Bandwidth', 'Vonage',
  'Okta', 'Auth0', 'CrowdStrike', 'SentinelOne',
  'Zscaler', 'Cloudflare', 'Fastly', 'Akamai',
  'DocuSign', 'Dropbox', 'Box', 'Notion',
  'Asana', 'Monday.com', 'ClickUp', 'Smartsheet',
  'Figma', 'Canva', 'InVision', 'Sketch',
  'Amplitude', 'Mixpanel', 'Segment', 'mParticle',
  'Braze', 'Iterable', 'Customer.io', 'Klaviyo',
  'HubSpot', 'Salesforce', 'Zendesk', 'Freshworks',
  'Intercom', 'Drift', 'Qualified', 'Gong',
  'Chorus.ai', 'Outreach', 'SalesLoft', 'Apollo.io',
  'ZoomInfo', 'Clearbit', 'Lusha', 'LeadIQ',
  'Crayon', 'Klue', 'Crayon Competitive Intelligence',
]

// FINS-specific company names (Finance, Insurance, Real Estate)
const finsCompanyNames = [
  'Meridian Credit Union', 'Coast Capital Savings', 'Vancity Credit Union',
  'Servus Credit Union', 'Conexus Credit Union', 'Libro Credit Union',
  'FirstOntario Credit Union', 'Alterna Savings', 'DUCA Financial',
  'Desjardins Group', 'National Bank', 'Laurentian Bank',
  'Canadian Western Bank', 'EQ Bank', 'Tangerine Bank',
  'Simplii Financial', 'Motus Bank', 'Manulife Bank',
  'HSBC Canada', 'Citco Canada',
  'Great-West Lifeco', 'iA Financial Group', 'Sun Life Financial',
  'Intact Financial', 'Definity Financial', 'Co-operators Group',
  'Aviva Canada', 'Wawanesa Mutual Insurance', 'Economical Insurance',
  'Gore Mutual Insurance', 'Northbridge Insurance',
  'RSA Insurance', 'Zurich Canada', 'Chubb Canada',
  'Berkshire Hathaway Canada', 'Travelers Canada',
  'Colliers International', 'CBRE Canada', 'Cushman & Wakefield Canada',
  'JLL Canada', 'Avison Young', 'Marcus & Millichap Canada',
  'RE/MAX Canada', 'Royal LePage', 'Century 21 Canada',
  'Keller Williams Canada', 'Sotheby\'s Realty Canada',
  'Peerage Capital', 'Brookfield Real Estate', 'Oxford Properties',
  'Cadillac Fairview', 'Morguard Corporation', 'Dream Unlimited',
  'H&R REIT', 'RioCan REIT', 'SmartCentres REIT',
  'Allied Properties REIT', 'Canadian Apartment Properties REIT',
  'Northwest Healthcare Properties', 'Granite REIT', 'WPT Industrial',
  'Summit Industrial Income REIT', 'Artis REIT',
  'CI Financial', 'Fidelity Investments Canada', 'AGF Management',
  'Purpose Investments', 'Mackenzie Investments', 'Dynamic Funds',
  'RBC Global Asset Management', 'TD Asset Management',
  'BMO Global Asset Management', 'CIBC Asset Management',
  'Mawer Investment Management', 'Beutel Goodman',
  'Letko Brosseau', 'Guardian Capital', 'Canaccord Genuity',
  'Echelon Wealth Partners', 'Richardson Wealth',
  'Raymond James Canada', 'Edward Jones Canada',
  'Harbourfront Wealth', 'Assante Wealth Management',
  'IG Wealth Management', 'Wellington-Altus Private Wealth',
  'Nicola Wealth Management', 'Leith Wheeler',
  'Phillips Hager & North', 'Connor Clark & Lunn',
  'Fiera Capital', 'Addenda Capital', 'AIMCO',
  'OTPP', 'CPPIB', 'CDPQ', 'BCI', 'PSP Investments',
  'AIMCo', 'HOOPP', 'OPTrust',
  'Trez Capital', 'Romspen Investment', 'KingSett Capital',
  'Firm Capital', 'Centurion Asset Management',
  'Timbercreek Capital', 'Fengate Asset Management',
  'Starlight Investments', 'QuadReal Property Group',
  'Great Gulf Group', 'Mattamy Homes', 'Tridel',
  'Menkes Developments', 'Daniels Corporation',
  'Onex Corporation', 'Sagard Holdings', 'Power Financial',
  'Northleaf Capital Partners', 'Torys Capital Markets',
  'Georgian Partners', 'OMERS Ventures',
  'Walter Capital', 'Novacap', 'Caisse de depot',
  'Teachers Venture Growth', 'BDC Capital',
  'Export Development Canada', 'Farm Credit Canada',
  'Alberta Investment Management',
]

// International company names by region
const internationalCompanies = [
  // UK
  { name: 'Barclays Wealth', country: 'United Kingdom', geo: 'London' },
  { name: 'Revolut', country: 'United Kingdom', geo: 'London' },
  { name: 'Monzo Bank', country: 'United Kingdom', geo: 'London' },
  { name: 'Starling Bank', country: 'United Kingdom', geo: 'London' },
  { name: 'Wise (TransferWise)', country: 'United Kingdom', geo: 'London' },
  { name: 'Checkout.com', country: 'United Kingdom', geo: 'London' },
  { name: 'GoCardless', country: 'United Kingdom', geo: 'London' },
  { name: 'OakNorth Bank', country: 'United Kingdom', geo: 'London' },
  { name: 'Atom Bank', country: 'United Kingdom', geo: 'Newcastle' },
  { name: 'Tide Platform', country: 'United Kingdom', geo: 'London' },
  { name: 'Thought Machine', country: 'United Kingdom', geo: 'London' },
  { name: 'Modulr Finance', country: 'United Kingdom', geo: 'Edinburgh' },
  { name: 'Eigen Technologies', country: 'United Kingdom', geo: 'London' },
  { name: 'Darktrace', country: 'United Kingdom', geo: 'Cambridge' },
  { name: 'Funding Circle', country: 'United Kingdom', geo: 'London' },
  { name: 'Hargreaves Lansdown', country: 'United Kingdom', geo: 'Bristol' },
  { name: 'AJ Bell', country: 'United Kingdom', geo: 'Manchester' },
  { name: 'Brewin Dolphin', country: 'United Kingdom', geo: 'London' },
  { name: 'Rathbones Group', country: 'United Kingdom', geo: 'London' },
  { name: 'St. James\'s Place', country: 'United Kingdom', geo: 'Cirencester' },
  // Germany
  { name: 'N26', country: 'Germany', geo: 'Berlin' },
  { name: 'Trade Republic', country: 'Germany', geo: 'Berlin' },
  { name: 'Scalable Capital', country: 'Germany', geo: 'Munich' },
  { name: 'Solarisbank', country: 'Germany', geo: 'Berlin' },
  { name: 'Mambu', country: 'Germany', geo: 'Berlin' },
  { name: 'Raisin', country: 'Germany', geo: 'Berlin' },
  { name: 'Wefox', country: 'Germany', geo: 'Berlin' },
  { name: 'Clark', country: 'Germany', geo: 'Frankfurt' },
  { name: 'Deposit Solutions', country: 'Germany', geo: 'Hamburg' },
  { name: 'Billie', country: 'Germany', geo: 'Berlin' },
  { name: 'Penta', country: 'Germany', geo: 'Berlin' },
  { name: 'Moss', country: 'Germany', geo: 'Berlin' },
  { name: 'Taxfix', country: 'Germany', geo: 'Berlin' },
  { name: 'Smava', country: 'Germany', geo: 'Berlin' },
  { name: 'Auxmoney', country: 'Germany', geo: 'Dusseldorf' },
  // Australia
  { name: 'Afterpay', country: 'Australia', geo: 'Melbourne' },
  { name: 'Judo Bank', country: 'Australia', geo: 'Melbourne' },
  { name: 'Xero', country: 'Australia', geo: 'Sydney' },
  { name: 'Tyro Payments', country: 'Australia', geo: 'Sydney' },
  { name: 'Zip Co', country: 'Australia', geo: 'Sydney' },
  { name: 'Athena Home Loans', country: 'Australia', geo: 'Sydney' },
  { name: 'Volt Bank', country: 'Australia', geo: 'Sydney' },
  { name: 'Up Bank', country: 'Australia', geo: 'Melbourne' },
  { name: '86 400', country: 'Australia', geo: 'Sydney' },
  { name: 'Airwallex', country: 'Australia', geo: 'Melbourne' },
  { name: 'Brighte', country: 'Australia', geo: 'Sydney' },
  { name: 'Prospa', country: 'Australia', geo: 'Sydney' },
  { name: 'Stake', country: 'Australia', geo: 'Sydney' },
  { name: 'Spaceship', country: 'Australia', geo: 'Sydney' },
  { name: 'Raiz Invest', country: 'Australia', geo: 'Sydney' },
  // Japan
  { name: 'PayPay Corporation', country: 'Japan', geo: 'Tokyo' },
  { name: 'Moneytree', country: 'Japan', geo: 'Tokyo' },
  { name: 'Freee K.K.', country: 'Japan', geo: 'Tokyo' },
  { name: 'Money Forward', country: 'Japan', geo: 'Tokyo' },
  { name: 'SmartHR', country: 'Japan', geo: 'Tokyo' },
  { name: 'Paidy', country: 'Japan', geo: 'Tokyo' },
  { name: 'LINE Financial', country: 'Japan', geo: 'Tokyo' },
  { name: 'SBI Sumishin Net Bank', country: 'Japan', geo: 'Tokyo' },
  { name: 'Rakuten Bank', country: 'Japan', geo: 'Tokyo' },
  { name: 'MUFG Innovation Partners', country: 'Japan', geo: 'Tokyo' },
  // Singapore
  { name: 'Grab Financial', country: 'Singapore', geo: 'Singapore' },
  { name: 'Sea Group', country: 'Singapore', geo: 'Singapore' },
  { name: 'Nium', country: 'Singapore', geo: 'Singapore' },
  { name: 'Aspire', country: 'Singapore', geo: 'Singapore' },
  { name: 'Endowus', country: 'Singapore', geo: 'Singapore' },
  { name: 'StashAway', country: 'Singapore', geo: 'Singapore' },
  { name: 'Syfe', country: 'Singapore', geo: 'Singapore' },
  { name: 'Funding Societies', country: 'Singapore', geo: 'Singapore' },
  { name: 'Validus Capital', country: 'Singapore', geo: 'Singapore' },
  { name: 'ANEXT Bank', country: 'Singapore', geo: 'Singapore' },
  // Brazil
  { name: 'Nubank', country: 'Brazil', geo: 'Sao Paulo' },
  { name: 'PagSeguro', country: 'Brazil', geo: 'Sao Paulo' },
  { name: 'Stone Co', country: 'Brazil', geo: 'Rio de Janeiro' },
  { name: 'Creditas', country: 'Brazil', geo: 'Sao Paulo' },
  { name: 'Ebanx', country: 'Brazil', geo: 'Curitiba' },
  { name: 'C6 Bank', country: 'Brazil', geo: 'Sao Paulo' },
  { name: 'Banco Inter', country: 'Brazil', geo: 'Belo Horizonte' },
  { name: 'Neon Pagamentos', country: 'Brazil', geo: 'Sao Paulo' },
  { name: 'Dock', country: 'Brazil', geo: 'Sao Paulo' },
  { name: 'Cora', country: 'Brazil', geo: 'Sao Paulo' },
  // India
  { name: 'Razorpay', country: 'India', geo: 'Bangalore' },
  { name: 'PhonePe', country: 'India', geo: 'Bangalore' },
  { name: 'CRED', country: 'India', geo: 'Bangalore' },
  { name: 'Zerodha', country: 'India', geo: 'Bangalore' },
  { name: 'Groww', country: 'India', geo: 'Bangalore' },
  { name: 'Slice', country: 'India', geo: 'Bangalore' },
  { name: 'Jupiter Money', country: 'India', geo: 'Mumbai' },
  { name: 'BharatPe', country: 'India', geo: 'New Delhi' },
  { name: 'Pine Labs', country: 'India', geo: 'Noida' },
  { name: 'Lendingkart', country: 'India', geo: 'Ahmedabad' },
  // France
  { name: 'Qonto', country: 'France', geo: 'Paris' },
  { name: 'Lydia', country: 'France', geo: 'Paris' },
  { name: 'Alan', country: 'France', geo: 'Paris' },
  { name: 'Pennylane', country: 'France', geo: 'Paris' },
  { name: 'Spendesk', country: 'France', geo: 'Paris' },
  // Netherlands
  { name: 'Adyen', country: 'Netherlands', geo: 'Amsterdam' },
  { name: 'Mollie', country: 'Netherlands', geo: 'Amsterdam' },
  { name: 'Bunq', country: 'Netherlands', geo: 'Amsterdam' },
  { name: 'Ohpen', country: 'Netherlands', geo: 'Amsterdam' },
  { name: 'BUX', country: 'Netherlands', geo: 'Amsterdam' },
  // Sweden
  { name: 'Klarna', country: 'Sweden', geo: 'Stockholm' },
  { name: 'Northvolt Finance', country: 'Sweden', geo: 'Stockholm' },
  { name: 'Tink', country: 'Sweden', geo: 'Stockholm' },
  { name: 'Anyfin', country: 'Sweden', geo: 'Stockholm' },
  { name: 'Lunar', country: 'Sweden', geo: 'Stockholm' },
  // Switzerland
  { name: 'Temenos', country: 'Switzerland', geo: 'Geneva' },
  { name: 'Avaloq', country: 'Switzerland', geo: 'Zurich' },
  { name: 'Numbrs', country: 'Switzerland', geo: 'Zurich' },
  { name: 'Additiv', country: 'Switzerland', geo: 'Zurich' },
  { name: 'Lykke', country: 'Switzerland', geo: 'Zurich' },
]

// Canadian cities with provinces
const canadianCities = [
  'Toronto, ON', 'Vancouver, BC', 'Montreal, QC', 'Calgary, AB', 'Ottawa, ON',
  'Edmonton, AB', 'Winnipeg, MB', 'Halifax, NS', 'Victoria, BC', 'Kitchener, ON',
  'Waterloo, ON', 'Hamilton, ON', 'Quebec City, QC', 'London, ON', 'Saskatoon, SK',
  'Regina, SK', 'St. John\'s, NL', 'Kelowna, BC', 'Guelph, ON', 'Mississauga, ON',
  'Brampton, ON', 'Markham, ON', 'Richmond Hill, ON', 'Burlington, ON', 'Oshawa, ON',
  'Barrie, ON', 'Surrey, BC', 'Burnaby, BC', 'Laval, QC', 'Sherbrooke, QC',
]

// US cities with states
const usCities = [
  'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL', 'Boston, MA',
  'Seattle, WA', 'Austin, TX', 'Denver, CO', 'Miami, FL', 'Atlanta, GA',
  'Dallas, TX', 'Houston, TX', 'Phoenix, AZ', 'Portland, OR', 'San Diego, CA',
  'Minneapolis, MN', 'Nashville, TN', 'Charlotte, NC', 'Detroit, MI', 'Salt Lake City, UT',
  'Raleigh, NC', 'Columbus, OH', 'Pittsburgh, PA', 'San Jose, CA', 'Philadelphia, PA',
  'Washington, DC', 'Baltimore, MD', 'Tampa, FL', 'Orlando, FL', 'Indianapolis, IN',
]

// Industries for general accounts
const generalIndustries = [
  'Technology', 'SaaS', 'E-commerce', 'Healthcare', 'Manufacturing',
  'Retail', 'Media', 'Education', 'Telecommunications', 'Energy',
  'Transportation', 'Agriculture', 'Construction', 'Hospitality',
  'Professional Services', 'Legal', 'Marketing', 'Logistics',
  'Food & Beverage', 'Automotive', 'Aerospace', 'Mining',
  'Pharmaceutical', 'Biotechnology', 'Clean Energy', 'Cybersecurity',
  'Cloud Computing', 'IoT', 'Artificial Intelligence', 'Robotics',
]

// Industries for FINS accounts
const finsIndustries = [
  'Banking', 'Credit Unions', 'Insurance', 'Wealth Management',
  'Investment Banking', 'Private Equity', 'Venture Capital',
  'Real Estate', 'Commercial Real Estate', 'Residential Real Estate',
  'REITs', 'Mortgage Lending', 'Asset Management',
  'Financial Planning', 'Brokerage', 'Payments',
  'Fintech', 'Regtech', 'Insurtech', 'Proptech',
  'Pension Funds', 'Hedge Funds', 'Family Office',
]

// Contact first names
const firstNames = [
  'Michael', 'Jennifer', 'Robert', 'Lisa', 'William',
  'Amanda', 'Daniel', 'Stephanie', 'Richard', 'Michelle',
  'Christopher', 'Nicole', 'Matthew', 'Jessica', 'Andrew',
  'Emily', 'Joshua', 'Lauren', 'Brian', 'Rachel',
  'Kevin', 'Megan', 'Thomas', 'Sarah', 'Mark',
  'Ashley', 'Steven', 'Heather', 'John', 'Katherine',
  'Raj', 'Priya', 'Wei', 'Yuki', 'Carlos',
  'Sofia', 'Ahmed', 'Fatima', 'Pierre', 'Marie',
  'Hans', 'Ingrid', 'Hiroshi', 'Akiko', 'Sanjay',
]

// Contact last names
const lastNames = [
  'Anderson', 'Brown', 'Campbell', 'Davis', 'Evans',
  'Foster', 'Garcia', 'Harris', 'Ibrahim', 'Jackson',
  'Kennedy', 'Lee', 'Martinez', 'Nguyen', 'O\'Connor',
  'Park', 'Quinn', 'Robinson', 'Singh', 'Thompson',
  'Ueda', 'Volkov', 'Williams', 'Xu', 'Young',
  'Zhang', 'Mueller', 'Schneider', 'Fischer', 'Weber',
  'Tanaka', 'Watanabe', 'Suzuki', 'Santos', 'Oliveira',
  'Dubois', 'Lambert', 'Johansson', 'Eriksson', 'Bergman',
]

// Contact titles
const contactTitles = [
  'VP of Finance', 'CFO', 'Director of Operations', 'Head of Treasury',
  'VP of Engineering', 'CTO', 'Director of IT', 'Head of Product',
  'VP of Sales', 'CRO', 'Director of Business Development', 'Head of Partnerships',
  'CEO', 'COO', 'President', 'Managing Director',
  'Controller', 'Treasurer', 'Director of Accounting', 'Head of FP&A',
  'VP of Customer Success', 'Director of Client Services', 'Head of Support',
  'VP of Marketing', 'CMO', 'Director of Growth', 'Head of Demand Gen',
  'General Manager', 'SVP of Strategy', 'Chief Digital Officer',
]

// Activity descriptions
const activityDescriptions = [
  'Transition status updated',
  'Account brief generated by AI',
  'Introduction email sent to new rep',
  'Follow-up meeting scheduled',
  'Internal handoff notes added',
  'Client meeting completed successfully',
  'Risk assessment updated based on health score decline',
  'Renewal strategy discussed in team sync',
  'New contact added to account',
  'Account owner reassigned via automated rule',
  'Brief reviewed and approved by manager',
  'Warm introduction email opened by client',
  'Client responded positively to transition intro',
  'Handoff checklist completed',
  'Account health score improved after outreach',
]

// Transition notes
const transitionNotes = [
  'Territory restructuring in the West region. Account needs warm handoff due to strong existing relationship.',
  'Rep departing end of month. High priority to maintain momentum on upcoming renewal.',
  'Rebalancing workload across the team. Account is stable and well-documented.',
  'Strategic account requires specialist attention. Moving to FINS-focused rep.',
  'Performance-based reassignment. Account needs more proactive engagement.',
  'Promotional move - rep transitioning to management. Need seamless handover.',
  'Geographic alignment initiative. Moving accounts to reps in local markets.',
  'Customer requested change due to timezone preferences.',
  'Annual book of business review led to this optimization.',
  'Cross-functional initiative requires different skill set for account management.',
]

// Brief content templates
const briefTemplates = [
  `## Account Overview\n\nThis account has been a valued client for over 2 years with consistent product usage across multiple business units.\n\n## Key Relationships\n\n- Primary contact is responsive and engaged\n- Executive sponsor has been involved in quarterly business reviews\n- Technical team is self-sufficient but appreciates proactive check-ins\n\n## Current State\n\n- Product adoption is strong at 85%+ across licensed modules\n- Recent expansion into analytics module (Q3)\n- Support ticket volume has been trending down\n\n## Transition Recommendations\n\n1. Schedule intro call within first week\n2. Review last 3 QBR decks for context\n3. Connect with technical POC before first meeting\n4. Prepare renewal strategy (coming up in 4 months)`,
  `## Account Overview\n\nMid-market financial services client with complex compliance requirements and a growing user base.\n\n## Key Relationships\n\n- CFO is the executive sponsor and decision maker\n- Director of IT manages day-to-day relationship\n- Strong champion in the treasury team\n\n## Current State\n\n- Completed migration to our platform 8 months ago\n- 3 open feature requests in the pipeline\n- Expansion opportunity in their wealth management division\n\n## Transition Recommendations\n\n1. Prioritize understanding their compliance workflow\n2. Review open support tickets and feature requests\n3. Schedule meeting with IT Director within first 5 days\n4. Prepare expansion proposal for wealth management`,
  `## Account Overview\n\nEnterprise technology company with a large deployment across 15 offices globally.\n\n## Key Relationships\n\n- VP of Operations is primary stakeholder\n- IT security team requires regular touchpoints\n- Procurement team handles all contract negotiations\n\n## Current State\n\n- Renewal is in 6 months, pricing review needed\n- Recently flagged concerns about API performance\n- Competitor evaluation was mentioned casually in last call\n\n## Transition Recommendations\n\n1. Address API performance concerns immediately\n2. Prepare competitive positioning materials\n3. Build relationship with procurement before renewal\n4. Schedule exec alignment meeting within 2 weeks`,
]

// Email subject templates
const emailSubjects = [
  'Introducing your new account manager',
  'Your dedicated team at Wealthsimple - seamless transition',
  'Quick intro from your new CSM',
  'Continuing our partnership - new point of contact',
  'Warm introduction and next steps',
  'Excited to partner with your team',
  'Follow-up: Account transition update',
  'Internal handoff notes for {account}',
  'Meeting scheduled: Account review with {account}',
  'Transition checklist complete for {account}',
]

// Email body templates
const emailBodies = [
  `Hi {contact},\n\nI hope this message finds you well. I wanted to reach out to introduce myself as your new account manager at Wealthsimple.\n\nI've been thoroughly briefed on your account and I'm excited to continue the great work that {from_rep} has been doing. I've reviewed your recent QBR materials, open requests, and product usage data to ensure a smooth transition.\n\nI'd love to schedule a brief introductory call at your convenience. Would any of the following times work?\n\n- Tuesday, 2:00 PM ET\n- Wednesday, 10:00 AM ET\n- Thursday, 3:00 PM ET\n\nLooking forward to connecting!\n\nBest regards,\n{to_rep}`,
  `Hi {contact},\n\nI'm reaching out as a follow-up to the transition of your account. I wanted to confirm that everything is going smoothly on your end and see if there are any questions or concerns I can address.\n\nAs a reminder, here are a few things I'm focused on for your account:\n\n1. Ensuring continuity on all open projects\n2. Preparing for your upcoming renewal\n3. Exploring the expansion opportunities we discussed\n\nPlease don't hesitate to reach out at any time. I'm here to help.\n\nBest,\n{to_rep}`,
  `Team,\n\nPlease find below the internal handoff notes for {account}:\n\n**Key contacts:** Listed in CRM\n**Open items:** 2 feature requests, 1 support ticket\n**Renewal:** {renewal_date}\n**Health status:** Stable\n\nAll documentation has been transferred. Please review the account brief for detailed context.\n\nThanks,\n{from_rep}`,
]

// ---------------------------------------------------------------------------
// Account Generation
// ---------------------------------------------------------------------------

const rand = seededRandom(42)

function generateAccountName(index: number, segment: AccountSegment): string {
  if (segment === 'fins' && index < finsCompanyNames.length) {
    return finsCompanyNames[index]
  }

  if (segment === 'international') {
    const intlIndex = index % internationalCompanies.length
    return internationalCompanies[intlIndex].name
  }

  // For commercial/corporate/enterprise, mix standalone names and generated names
  const allStandalone = [...standaloneCompanyNames, ...usCompanyNames]
  if (index < allStandalone.length) {
    return allStandalone[index % allStandalone.length]
  }

  // Generate a name from parts
  const prefix = companyPrefixes[index % companyPrefixes.length]
  const suffix = companySuffixes[(index * 7) % companySuffixes.length]
  return `${prefix} ${suffix}`
}

function getSubSegment(employeeCount: number): AccountSubSegment {
  if (employeeCount >= 1000) return 'enterprise'
  if (employeeCount >= 200) return 'mid_market'
  return 'smb'
}

function generateAccounts(): Account[] {
  const accounts: Account[] = []
  const rng = seededRandom(12345)

  // Segment definitions
  const segments: {
    segment: AccountSegment
    count: number
    employeeRange: [number, number]
    arrRange: [number, number]
  }[] = [
    { segment: 'commercial', count: 600, employeeRange: [1, 200], arrRange: [5000, 50000] },
    { segment: 'corporate', count: 500, employeeRange: [200, 1000], arrRange: [50000, 250000] },
    { segment: 'enterprise', count: 300, employeeRange: [1000, 50000], arrRange: [250000, 2000000] },
    { segment: 'fins', count: 400, employeeRange: [10, 10000], arrRange: [20000, 500000] },
    { segment: 'international', count: 200, employeeRange: [20, 5000], arrRange: [10000, 300000] },
  ]

  // Track used names to avoid duplicates
  const usedNames = new Set<string>()
  let globalIndex = 0

  // Reps that can own accounts (ids user-2 through user-6, skip admin user-1)
  const repIds = ['user-2', 'user-3', 'user-4', 'user-5', 'user-6']

  for (const seg of segments) {
    // Track per-segment name index for segment-specific name pools
    let segNameIndex = 0

    for (let i = 0; i < seg.count; i++) {
      globalIndex++

      // Generate unique name using segment-specific pools + fallback generation
      let name: string = ''
      const finsSpecific = ['Capital', 'Financial', 'Advisors', 'Wealth', 'Holdings', 'Investment Group', 'Trust', 'Partners', 'Securities', 'Asset Management', 'Bancshares', 'Insurance Group', 'Realty', 'Mortgage', 'Funding']
      const intlSuffix = ['Global', 'International', 'Worldwide', 'APAC', 'EMEA', 'Group', 'Holdings', 'Corp', 'PLC', 'SA', 'AG', 'GmbH', 'KK', 'Pte Ltd']

      if (seg.segment === 'fins') {
        if (segNameIndex < finsCompanyNames.length) {
          name = finsCompanyNames[segNameIndex]
        }
      } else if (seg.segment === 'international') {
        if (segNameIndex < internationalCompanies.length) {
          name = internationalCompanies[segNameIndex].name
        }
      } else if (seg.segment === 'commercial') {
        if (segNameIndex < standaloneCompanyNames.length) {
          name = standaloneCompanyNames[segNameIndex]
        }
      } else if (seg.segment === 'corporate') {
        if (segNameIndex < usCompanyNames.length) {
          name = usCompanyNames[segNameIndex]
        }
      } else {
        // enterprise
        if (segNameIndex < enterpriseCompanyNames.length) {
          name = enterpriseCompanyNames[segNameIndex]
        }
      }

      // Fallback: generate a unique name from prefix + suffix combos
      if (!name || usedNames.has(name)) {
        const pLen = companyPrefixes.length
        const sLen = companySuffixes.length
        const midWords = ['Bay', 'Point', 'Creek', 'Stone', 'Field', 'Cross', 'Gate', 'Port', 'Ridge', 'Lake', 'Hill', 'Park', 'Glen', 'Dale', 'View', 'Cove', 'Vale', 'Brook', 'Shore', 'Haven']

        // Strategy 1: two-part names with segment-specific suffixes
        let found = false
        for (let attempt = 0; attempt < pLen * 3 && !found; attempt++) {
          if (seg.segment === 'fins') {
            const pi = (segNameIndex * 3 + attempt * 7 + 1) % pLen
            const fi = (segNameIndex + attempt) % finsSpecific.length
            name = `${companyPrefixes[pi]} ${finsSpecific[fi]}`
          } else if (seg.segment === 'international') {
            const pi = (segNameIndex * 7 + attempt * 11 + 3) % pLen
            const ii = (segNameIndex + attempt) % intlSuffix.length
            name = `${companyPrefixes[pi]} ${intlSuffix[ii]}`
          } else {
            const segOffset = seg.segment === 'commercial' ? 0 : seg.segment === 'corporate' ? 13 : 29
            const pi = (segNameIndex + attempt * 3 + segOffset) % pLen
            const si = (segNameIndex * 7 + attempt * 11 + segOffset * 5) % sLen
            name = `${companyPrefixes[pi]} ${companySuffixes[si]}`
          }
          if (!usedNames.has(name)) found = true
        }

        // Strategy 2: three-part compound names (e.g. "NorthBay Solutions")
        if (!found) {
          for (let attempt = 0; attempt < pLen * midWords.length && !found; attempt++) {
            const pi = (segNameIndex + attempt) % pLen
            const mi = (segNameIndex * 3 + attempt * 7) % midWords.length
            if (seg.segment === 'fins') {
              const fi = (segNameIndex + attempt) % finsSpecific.length
              name = `${companyPrefixes[pi]}${midWords[mi]} ${finsSpecific[fi]}`
            } else if (seg.segment === 'international') {
              const ii = (segNameIndex + attempt) % intlSuffix.length
              name = `${companyPrefixes[pi]}${midWords[mi]} ${intlSuffix[ii]}`
            } else {
              const si = (segNameIndex + attempt * 3) % sLen
              name = `${companyPrefixes[pi]}${midWords[mi]} ${companySuffixes[si]}`
            }
            if (!usedNames.has(name)) found = true
          }
        }

        // Strategy 3: absolute fallback with global index
        if (!found) {
          name = `${pick(companyPrefixes, rng)} ${pick(companySuffixes, rng)} ${globalIndex}`
        }
      }

      usedNames.add(name)
      segNameIndex++

      // Employee count
      const employeeCount = rangeInt(seg.employeeRange[0], seg.employeeRange[1], rng)

      // ARR - use a curve to make distribution realistic
      const arrBase = seg.arrRange[0]
      const arrSpread = seg.arrRange[1] - seg.arrRange[0]
      const arrRand = rng()
      // Skew towards lower end (more smaller accounts)
      const arr = Math.round((arrBase + arrSpread * arrRand * arrRand) / 100) * 100

      // Health score - bell curve centered around 65
      const h1 = rng()
      const h2 = rng()
      const healthRaw = (h1 + h2) / 2 * 100
      const healthScore = Math.max(5, Math.min(100, Math.round(healthRaw)))

      // Sub-segment based on employee count
      const subSegment = getSubSegment(employeeCount)

      // Country and geography
      let country: string
      let geography: string
      if (seg.segment === 'international') {
        const intlIdx = i % internationalCompanies.length
        country = internationalCompanies[intlIdx].country
        geography = internationalCompanies[intlIdx].geo
      } else if (seg.segment === 'fins') {
        // FINS are Canadian/US mix
        if (rng() < 0.7) {
          country = 'Canada'
          geography = pick(canadianCities, rng)
        } else {
          country = 'United States'
          geography = pick(usCities, rng)
        }
      } else {
        // Mix of Canadian and US
        if (rng() < 0.55) {
          country = 'Canada'
          geography = pick(canadianCities, rng)
        } else {
          country = 'United States'
          geography = pick(usCities, rng)
        }
      }

      // Industry
      const industry = seg.segment === 'fins'
        ? pick(finsIndustries, rng)
        : pick(generalIndustries, rng)

      // Owner - distribute across reps based on segment specialties
      let ownerId: string
      if (seg.segment === 'enterprise') {
        // Enterprise goes to user-2 (manager) or user-4 (FINS/Enterprise rep)
        ownerId = rng() < 0.4 ? 'user-2' : (rng() < 0.5 ? 'user-4' : pick(repIds, rng))
      } else if (seg.segment === 'fins') {
        // FINS goes primarily to user-4 and user-6
        ownerId = rng() < 0.45 ? 'user-4' : (rng() < 0.6 ? 'user-6' : pick(repIds, rng))
      } else if (seg.segment === 'commercial') {
        // Commercial goes primarily to user-3 and user-5
        ownerId = rng() < 0.4 ? 'user-3' : (rng() < 0.5 ? 'user-5' : pick(repIds, rng))
      } else if (seg.segment === 'international') {
        // International goes primarily to user-5
        ownerId = rng() < 0.5 ? 'user-5' : pick(repIds, rng)
      } else {
        // Corporate spread across user-3, user-6, user-2
        ownerId = rng() < 0.35 ? 'user-3' : (rng() < 0.5 ? 'user-6' : (rng() < 0.6 ? 'user-2' : pick(repIds, rng)))
      }

      // Renewal date spread across next 12 months from Jan 2026
      const renewalMonth = rangeInt(1, 12, rng)
      const renewalDay = rangeInt(1, 28, rng)
      const renewalDate = dateStr(2026, renewalMonth, renewalDay)

      // External ID (CRM ID)
      const externalId = `SF-${padNum(globalIndex * 37 % 99999, 5)}`

      const now = '2025-12-01'

      accounts.push({
        id: `acc-${globalIndex}`,
        org_id: 'org-1',
        external_id: externalId,
        name,
        industry,
        arr,
        health_score: healthScore,
        geography,
        segment: seg.segment,
        renewal_date: renewalDate,
        sub_segment: subSegment,
        employee_count: employeeCount,
        country,
        current_owner_id: ownerId,
        crm_source: 'salesforce',
        raw_data: {},
        created_at: now,
        updated_at: now,
      })
    }
  }

  return accounts
}

export const demoAccounts: Account[] = generateAccounts()

// ---------------------------------------------------------------------------
// Contacts (30 contacts across key accounts)
// ---------------------------------------------------------------------------

function generateContacts(): AccountContact[] {
  const contacts: AccountContact[] = []
  const rng = seededRandom(7777)

  // Pick key accounts - top accounts by ARR across different segments
  const sortedByArr = [...demoAccounts].sort((a, b) => b.arr - a.arr)
  const keyAccounts = sortedByArr.slice(0, 20)
  // Also add some mid-tier accounts
  const midAccounts = sortedByArr.slice(100, 110)
  const contactAccounts = [...keyAccounts, ...midAccounts]

  const roles: Array<'champion' | 'decision_maker' | 'end_user' | 'exec_sponsor'> = [
    'champion', 'decision_maker', 'end_user', 'exec_sponsor',
  ]

  for (let i = 0; i < 30; i++) {
    const account = contactAccounts[i % contactAccounts.length]
    const firstName = firstNames[pickIndex(firstNames.length, rng)]
    const lastName = lastNames[pickIndex(lastNames.length, rng)]
    const name = `${firstName} ${lastName}`
    const title = contactTitles[pickIndex(contactTitles.length, rng)]
    const role = roles[pickIndex(roles.length, rng)]
    const emailDomain = account.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)

    contacts.push({
      id: `contact-${i + 1}`,
      account_id: account.id,
      name,
      title,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/'/g, '')}@${emailDomain}.com`,
      phone: `+1-${rangeInt(200, 999, rng)}-${rangeInt(100, 999, rng)}-${rangeInt(1000, 9999, rng)}`,
      role,
      is_primary: i % contactAccounts.length === 0, // First contact per account is primary
      created_at: '2025-06-15',
    })
  }

  return contacts
}

export const demoContacts: AccountContact[] = generateContacts()

// ---------------------------------------------------------------------------
// Transitions (20 sample transitions in various statuses)
// ---------------------------------------------------------------------------

function generateTransitions(): Transition[] {
  const transitions: Transition[] = []
  const rng = seededRandom(9999)

  const statuses: Array<'draft' | 'pending_approval' | 'approved' | 'intro_sent' | 'meeting_booked' | 'in_progress' | 'completed' | 'stalled'> = [
    'draft', 'pending_approval', 'approved', 'intro_sent',
    'meeting_booked', 'in_progress', 'completed', 'stalled',
  ]

  const reasons: Array<'territory_change' | 'rep_departure' | 'rebalance' | 'promotion' | 'performance'> = [
    'territory_change', 'rep_departure', 'rebalance', 'promotion', 'performance',
  ]

  const priorities: Array<'critical' | 'high' | 'medium' | 'low'> = [
    'critical', 'high', 'medium', 'low',
  ]

  const repIds = ['user-2', 'user-3', 'user-4', 'user-5', 'user-6']

  // Pick accounts for transitions - mix of high-value and mid-value
  const sortedByArr = [...demoAccounts].sort((a, b) => b.arr - a.arr)
  const transitionAccounts = [
    ...sortedByArr.slice(0, 8),    // top 8
    ...sortedByArr.slice(50, 56),  // mid-high 6
    ...sortedByArr.slice(200, 206), // mid 6
  ]

  for (let i = 0; i < 20; i++) {
    const account = transitionAccounts[i % transitionAccounts.length]
    const status = statuses[i % statuses.length]
    const reason = reasons[pickIndex(reasons.length, rng)]
    const priority = priorities[pickIndex(priorities.length, rng)]

    // From owner is current owner, to owner is different
    const fromOwnerId = account.current_owner_id || 'user-3'
    let toOwnerId: string
    do {
      toOwnerId = repIds[pickIndex(repIds.length, rng)]
    } while (toOwnerId === fromOwnerId)

    const createdDay = rangeInt(1, 28, rng)
    const createdMonth = rangeInt(9, 12, rng)
    const createdAt = dateStr(2025, createdMonth, createdDay)

    const dueMonth = rangeInt(1, 3, rng)
    const dueDay = rangeInt(1, 28, rng)
    const dueDate = dateStr(2026, dueMonth, dueDay)

    const completedAt = status === 'completed'
      ? dateStr(2025, rangeInt(11, 12, rng), rangeInt(1, 28, rng))
      : null

    transitions.push({
      id: `trans-${i + 1}`,
      org_id: 'org-1',
      account_id: account.id,
      from_owner_id: fromOwnerId,
      to_owner_id: toOwnerId,
      status,
      reason,
      priority,
      due_date: dueDate,
      completed_at: completedAt,
      notes: transitionNotes[i % transitionNotes.length],
      created_at: createdAt,
      updated_at: createdAt,
    })
  }

  return transitions
}

export const demoTransitions: Transition[] = generateTransitions()

// ---------------------------------------------------------------------------
// Activities (15 sample activities)
// ---------------------------------------------------------------------------

function generateActivities(): TransitionActivity[] {
  const activities: TransitionActivity[] = []
  const rng = seededRandom(5555)

  const activityTypes: Array<'status_change' | 'brief_generated' | 'email_sent' | 'meeting_booked' | 'note_added'> = [
    'status_change', 'brief_generated', 'email_sent', 'meeting_booked', 'note_added',
  ]

  const repIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6']

  for (let i = 0; i < 15; i++) {
    const transitionIdx = i % demoTransitions.length
    const transition = demoTransitions[transitionIdx]
    const type = activityTypes[i % activityTypes.length]

    const day = rangeInt(1, 28, rng)
    const month = rangeInt(10, 12, rng)

    activities.push({
      id: `activity-${i + 1}`,
      org_id: 'org-1',
      transition_id: transition.id,
      type,
      description: activityDescriptions[i % activityDescriptions.length],
      metadata: type === 'status_change'
        ? { from_status: 'draft', to_status: transition.status }
        : {},
      created_by: repIds[pickIndex(repIds.length, rng)],
      created_at: dateStr(2025, month, day),
    })
  }

  return activities
}

export const demoActivities: TransitionActivity[] = generateActivities()

// ---------------------------------------------------------------------------
// Rules (sample assignment rules)
// ---------------------------------------------------------------------------

export const demoRules: AssignmentRule[] = [
  {
    id: 'rule-1',
    org_id: 'org-1',
    name: 'FINS accounts to FINS specialists',
    rules: [
      {
        field: 'segment',
        operator: 'equals' as const,
        value: 'fins',
        action: { type: 'assign_pool' as const, target_ids: ['user-4', 'user-6'] },
      },
    ],
    is_active: true,
    priority: 1,
    created_at: '2025-01-15',
    updated_at: '2025-01-15',
  },
  {
    id: 'rule-2',
    org_id: 'org-1',
    name: 'Enterprise accounts to senior reps',
    rules: [
      {
        field: 'segment',
        operator: 'equals' as const,
        value: 'enterprise',
        action: { type: 'assign_pool' as const, target_ids: ['user-2', 'user-4'] },
      },
    ],
    is_active: true,
    priority: 2,
    created_at: '2025-01-15',
    updated_at: '2025-01-15',
  },
  {
    id: 'rule-3',
    org_id: 'org-1',
    name: 'International accounts routing',
    rules: [
      {
        field: 'segment',
        operator: 'equals' as const,
        value: 'international',
        action: { type: 'assign_pool' as const, target_ids: ['user-5'] },
      },
    ],
    is_active: true,
    priority: 3,
    created_at: '2025-02-01',
    updated_at: '2025-02-01',
  },
  {
    id: 'rule-4',
    org_id: 'org-1',
    name: 'High ARR accounts need experienced reps',
    rules: [
      {
        field: 'arr',
        operator: 'greater_than' as const,
        value: 500000,
        action: { type: 'assign_pool' as const, target_ids: ['user-2', 'user-4'] },
      },
    ],
    is_active: true,
    priority: 4,
    created_at: '2025-02-15',
    updated_at: '2025-02-15',
  },
  {
    id: 'rule-5',
    org_id: 'org-1',
    name: 'Round robin for Commercial SMB',
    rules: [
      {
        field: 'segment',
        operator: 'equals' as const,
        value: 'commercial',
        action: { type: 'round_robin' as const },
      },
    ],
    is_active: false,
    priority: 5,
    created_at: '2025-03-01',
    updated_at: '2025-03-01',
  },
  {
    id: 'rule-6',
    org_id: 'org-1',
    name: 'At-risk accounts to senior reps',
    rules: [
      {
        field: 'health_score',
        operator: 'less_than' as const,
        value: 30,
        action: { type: 'assign_pool' as const, target_ids: ['user-2', 'user-3'] },
      },
    ],
    is_active: true,
    priority: 6,
    created_at: '2025-03-15',
    updated_at: '2025-03-15',
  },
]

// ---------------------------------------------------------------------------
// Briefs (for transitions that have progressed past draft)
// ---------------------------------------------------------------------------

function generateBriefs(): TransitionBrief[] {
  const briefs: TransitionBrief[] = []

  const transitionsWithBriefs = demoTransitions.filter(
    t => t.status !== 'draft' && t.status !== 'pending_approval'
  )

  for (let i = 0; i < transitionsWithBriefs.length; i++) {
    const transition = transitionsWithBriefs[i]
    const briefStatus = transition.status === 'completed' ? 'approved' as const
      : transition.status === 'in_progress' ? 'reviewed' as const
      : 'draft' as const

    briefs.push({
      id: `brief-${i + 1}`,
      org_id: 'org-1',
      transition_id: transition.id,
      content: briefTemplates[i % briefTemplates.length],
      status: briefStatus,
      version: briefStatus === 'approved' ? 2 : 1,
      ai_generated: true,
      generated_at: transition.created_at,
      edited_at: briefStatus !== 'draft' ? '2025-12-15' : null,
      created_at: transition.created_at,
    })
  }

  return briefs
}

export const demoBriefs: TransitionBrief[] = generateBriefs()

// ---------------------------------------------------------------------------
// Emails (for transitions that have reached intro_sent or beyond)
// ---------------------------------------------------------------------------

function generateEmails(): TransitionEmail[] {
  const emails: TransitionEmail[] = []
  const rng = seededRandom(3333)

  const transitionsWithEmails = demoTransitions.filter(
    t => ['intro_sent', 'meeting_booked', 'in_progress', 'completed'].includes(t.status)
  )

  const emailTypes: Array<'warm_intro' | 'follow_up' | 'internal_handoff'> = [
    'warm_intro', 'follow_up', 'internal_handoff',
  ]

  const emailStatuses: Array<'draft' | 'approved' | 'sent' | 'opened' | 'replied'> = [
    'sent', 'opened', 'replied', 'sent', 'approved',
  ]

  let emailIdx = 0
  for (const transition of transitionsWithEmails) {
    // Each transition gets 1-2 emails
    const numEmails = transition.status === 'completed' ? 2 : 1

    for (let j = 0; j < numEmails; j++) {
      emailIdx++
      const type = emailTypes[emailIdx % emailTypes.length]
      const status = emailStatuses[emailIdx % emailStatuses.length]

      // Find a contact for this account
      const accountContacts = demoContacts.filter(c => c.account_id === transition.account_id)
      const contactId = accountContacts.length > 0 ? accountContacts[0].id : null

      const subject = emailSubjects[emailIdx % emailSubjects.length]
        .replace('{account}', demoAccounts.find(a => a.id === transition.account_id)?.name || 'Account')
      const body = emailBodies[emailIdx % emailBodies.length]
        .replace(/{contact}/g, accountContacts[0]?.name || 'there')
        .replace(/{from_rep}/g, demoTeamMembers.find(m => m.id === transition.from_owner_id)?.full_name || 'the previous rep')
        .replace(/{to_rep}/g, demoTeamMembers.find(m => m.id === transition.to_owner_id)?.full_name || 'the new rep')
        .replace(/{account}/g, demoAccounts.find(a => a.id === transition.account_id)?.name || 'Account')
        .replace(/{renewal_date}/g, demoAccounts.find(a => a.id === transition.account_id)?.renewal_date || 'TBD')

      const sentAt = ['sent', 'opened', 'replied'].includes(status)
        ? dateStr(2025, rangeInt(10, 12, rng), rangeInt(1, 28, rng))
        : null

      emails.push({
        id: `email-${emailIdx}`,
        org_id: 'org-1',
        transition_id: transition.id,
        contact_id: contactId,
        type,
        subject,
        body,
        status,
        sent_at: sentAt,
        ai_generated: type !== 'internal_handoff',
        created_at: transition.created_at,
      })
    }
  }

  return emails
}

export const demoEmails: TransitionEmail[] = generateEmails()

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Calculate dashboard metrics from demo data
 */
export function getDemoMetrics(): DashboardMetrics {
  const activeTransitions = demoTransitions.filter(
    t => !['completed', 'cancelled'].includes(t.status)
  ).length

  const introsSentThisWeek = demoTransitions.filter(
    t => t.status === 'intro_sent'
  ).length

  const meetingsBooked = demoTransitions.filter(
    t => t.status === 'meeting_booked'
  ).length

  const stalledCount = demoTransitions.filter(
    t => t.status === 'stalled'
  ).length

  const atRiskCount = demoAccounts.filter(
    a => a.health_score < 40
  ).length

  const totalArrInTransition = demoTransitions
    .filter(t => !['completed', 'cancelled'].includes(t.status))
    .reduce((sum, t) => {
      const account = demoAccounts.find(a => a.id === t.account_id)
      return sum + (account?.arr || 0)
    }, 0)

  return {
    active_transitions: activeTransitions,
    intros_sent_this_week: introsSentThisWeek,
    meetings_booked: meetingsBooked,
    stalled_count: stalledCount,
    at_risk_count: atRiskCount,
    total_arr_in_transition: totalArrInTransition,
  }
}

/**
 * Aggregate transitions by status for pipeline view
 */
export function getDemoPipeline(): PipelineItem[] {
  const statusOrder: Array<'draft' | 'pending_approval' | 'approved' | 'intro_sent' | 'meeting_booked' | 'in_progress' | 'completed' | 'stalled' | 'cancelled'> = [
    'draft', 'pending_approval', 'approved', 'intro_sent',
    'meeting_booked', 'in_progress', 'completed', 'stalled', 'cancelled',
  ]

  const counts = new Map<string, number>()
  for (const t of demoTransitions) {
    counts.set(t.status, (counts.get(t.status) || 0) + 1)
  }

  return statusOrder.map(status => ({
    status,
    count: counts.get(status) || 0,
  }))
}

/**
 * Calculate workload per rep vs their capacity
 */
export function getDemoWorkload(): RepWorkload[] {
  // Only reps and managers (not admin)
  const workloadUsers = demoTeamMembers.filter(m => m.role !== 'admin')

  return workloadUsers.map(user => {
    const accountCount = demoAccounts.filter(
      a => a.current_owner_id === user.id
    ).length

    const activeTransitions = demoTransitions.filter(
      t => (t.from_owner_id === user.id || t.to_owner_id === user.id) &&
           !['completed', 'cancelled'].includes(t.status)
    ).length

    return {
      id: user.id,
      full_name: user.full_name,
      capacity: user.capacity,
      account_count: accountCount,
      active_transitions: activeTransitions,
    }
  })
}

/**
 * Get the most recent activities (last 20)
 */
export function getDemoRecentActivities(): TransitionActivity[] {
  return [...demoActivities]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
}
