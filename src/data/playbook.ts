import {
  Ambassador,
  CoreLeadMeta,
  GovernanceNode,
  GovernanceNodeKey,
  KpiWeights,
  PortalDB,
  SquadMeta,
  SquadName,
} from '../types';

export const DB_KEY = 'ue_ca_portal_v2_4tier_db';

export const GOVERNANCE_NODES: Record<GovernanceNodeKey, GovernanceNode> = {
  chair: {
    tier: 'Tier 1 · Strategic Head',
    excom: 'Program Chair (CA Lead)',
    title: 'Program Chair (CA Lead)',
    reporting:
      'Reports directly to Ulterior Engineering Management; oversees the Program Secretary and overall program governance.',
    mandate:
      'Translates company business targets into monthly campus campaigns, chairs weekly Core Syncs, approves ambassador incentives & certificates, and resolves strategic escalations.',
    kpis: [
      'Quarterly company workshop & course conversion targets',
      'Qualified FYDP / engineering service revenue pipeline',
      'Program-wide retention and multi-campus brand authority',
    ],
    applyRole: 'Program Secretary',
    cta: 'Apply for Executive Team',
  },
  secretary: {
    tier: 'Tier 2 · Executive Coordination',
    excom: 'General Secretary',
    title: 'Program Secretary',
    reporting:
      'Reports directly to Program Chair; directly coordinates and supervises all 5 Core Team Leads.',
    mandate:
      'Acts as the operational backbone between the Chair and Core Team Leads. Runs ExCom documentation, enforces weekly reporting cutoffs, audits cross-squad KPI logs, and coordinates inter-portfolio campaign rollouts.',
    kpis: [
      '100% on-time weekly Core Sync & squad reporting compliance',
      'Zero audit discrepancies on monthly KPI point ledgers',
      'Cross-lead campaign kit alignment before launch deadlines',
    ],
    applyRole: 'Program Secretary',
    cta: 'Apply as Program Secretary',
  },
  lead1: {
    tier: 'Tier 3 · Core Team Lead 01',
    excom: 'ExCom: Operations & HR',
    title: 'Operations & CA HR Lead',
    reporting:
      'Reports to Program Secretary & Chair; leads Squad A (Dhaka Zone A — Private Hub).',
    mandate:
      'Manages ambassador onboarding, central roster maintenance, weekly attendance tracking, monthly KPI tracking sheet updates, and certificate eligibility audits.',
    kpis: [
      'Active CA retention rate across all 5 squads',
      'On-time weekly proof submission compliance',
      'Accurate certificate eligibility ledger',
    ],
    applyRole: 'Operations & CA HR Lead',
    cta: 'Apply for Operations Lead',
  },
  lead2: {
    tier: 'Tier 3 · Core Team Lead 02',
    excom: 'ExCom: Membership & Growth',
    title: 'Workshop & Course Growth Lead',
    reporting:
      'Reports to Program Secretary & Chair; leads Squad B (Dhaka Zone B — Central & Public).',
    mandate:
      'Designs registration campaigns for Ulterior Engineering workshops, bootcamps, and training courses; manages CA referral links/codes and conversion follow-ups.',
    kpis: [
      'Total verified workshop & course registrations via CAs',
      'Referral link click-to-enrollment conversion rate',
      'Repeat participant attendance across bootcamps',
    ],
    applyRole: 'Workshop & Course Growth Lead',
    cta: 'Apply for Course Growth Lead',
  },
  lead3: {
    tier: 'Tier 3 · Core Team Lead 03',
    excom: 'ExCom: Technical / Corporate',
    title: 'Technical Project & Lead-Gen Lead',
    reporting:
      'Reports to Program Secretary & Chair; leads Squad C (Engineering & Tech Hub).',
    mandate:
      'Equips CAs with consultative pitch scripts to spot FYDP/thesis teams, robotics groups, or engineering service clients; screens and hands off verified leads to Ulterior Engineering engineers.',
    kpis: [
      'Number of qualified FYDP / hardware / service inquiries',
      'Lead qualification accuracy & handoff speed',
      'Converted technical project revenue attribution',
    ],
    applyRole: 'Technical Project & Lead-Gen Lead',
    cta: 'Apply for Tech Lead-Gen Lead',
  },
  lead4: {
    tier: 'Tier 3 · Core Team Lead 04',
    excom: 'ExCom: Media & PR',
    title: 'Brand & Digital Publicity Lead',
    reporting:
      'Reports to Program Secretary & Chair; leads Squad D (Regional General Universities).',
    mandate:
      'Prepares ready-to-deploy campaign kits (captions, graphics briefs, LinkedIn/Facebook/story schedules) so every ambassador represents Ulterior Engineering cleanly and consistently.',
    kpis: [
      'Posting consistency within official campaign windows',
      'Organic reach across LinkedIn & campus student groups',
      'High-engagement student-facing storytelling quality',
    ],
    applyRole: 'Brand & Digital Publicity Lead',
    cta: 'Apply for Brand & PR Lead',
  },
  lead5: {
    tier: 'Tier 3 · Core Team Lead 05',
    excom: 'ExCom: Events & Partnerships',
    title: 'Campus Partnerships & Events Lead',
    reporting:
      'Reports to Program Secretary & Chair; leads Squad E (Polytechnic & Emerging Campuses).',
    mandate:
      'Coordinates collaborations with university EEE, CSE, Robotics, and IEEE student branches for offline technical seminars, hands-on workshops, and campus booths.',
    kpis: [
      'Number of active university club partnerships',
      'Executed offline seminars & campus activations',
      'Co-branded club event attendance',
    ],
    applyRole: 'Campus Partnerships & Events Lead',
    cta: 'Apply for Partnerships Lead',
  },
  general: {
    tier: 'Tier 4 · Campus Execution Force',
    excom: 'Squads A – E Ambassadors',
    title: 'General Campus Ambassadors',
    reporting: 'Report strictly to their assigned Core Squad Lead (Tier 3).',
    mandate:
      'Execute all three company pillars on their home campus: promote workshops using personal referral links, identify FYDP/hardware project leads, share brand campaigns, and connect local clubs.',
    kpis: [
      'Confirmed workshop registrations via personal referral code',
      'Verified FYDP / engineering service project leads',
      'Timely campaign posts & weekly activity log discipline',
    ],
    applyRole: 'General Campus Ambassador',
    cta: 'Apply as General CA',
  },
};

export const CORE_LEADS_LIST: CoreLeadMeta[] = [
  {
    id: 'lead1',
    num: '01',
    title: 'Operations & CA HR Lead',
    squad: 'Squad A',
    excom: 'Ops / HR',
    desc: 'Onboarding, roster tracking, attendance & KPI ledger upkeep.',
  },
  {
    id: 'lead2',
    num: '02',
    title: 'Workshop & Course Growth Lead',
    squad: 'Squad B',
    excom: 'Growth',
    desc: 'Bootcamp registration drives, referral codes & conversions.',
  },
  {
    id: 'lead3',
    num: '03',
    title: 'Technical Project & Lead-Gen Lead',
    squad: 'Squad C',
    excom: 'Technical',
    desc: 'FYDP, thesis, robotics & hardware client lead qualification.',
  },
  {
    id: 'lead4',
    num: '04',
    title: 'Brand & Digital Publicity Lead',
    squad: 'Squad D',
    excom: 'Media & PR',
    desc: 'Ready-to-deploy campaign kits, captions & LinkedIn reach.',
  },
  {
    id: 'lead5',
    num: '05',
    title: 'Campus Partnerships & Events Lead',
    squad: 'Squad E',
    excom: 'Events',
    desc: 'IEEE, Robotics & EEE/CSE club seminars and campus booths.',
  },
];

export const SQUAD_NAMES: SquadName[] = [
  'Squad A',
  'Squad B',
  'Squad C',
  'Squad D',
  'Squad E',
];

export const SQUADS_META: Record<SquadName, SquadMeta> = {
  'Squad A': {
    cluster: 'Dhaka Zone A (Private Hub)',
    leadPortfolio: 'Lead 1 · Operations & CA HR Lead',
    coverage:
      'Private universities concentrated around Bashundhara, Uttara, Banani, and Gulshan belts.',
    campuses: [
      'North South University (NSU)',
      'AIUB',
      'IUB',
      'BRAC University',
      'UIU',
      'East West University',
    ],
  },
  'Squad B': {
    cluster: 'Dhaka Zone B (Central & Public)',
    leadPortfolio: 'Lead 2 · Workshop & Course Growth Lead',
    coverage:
      'Public, engineering, and private campuses across Dhanmondi, Farmgate, Mirpur, and central Dhaka.',
    campuses: [
      'BUET',
      'University of Dhaka',
      'AUST',
      'MIST',
      'UAP',
      'Daffodil International Univ',
    ],
  },
  'Squad C': {
    cluster: 'Engineering & Tech Hub',
    leadPortfolio: 'Lead 3 · Technical Project & Lead-Gen Lead',
    coverage:
      'Dedicated engineering and science/technology universities outside central Dhaka.',
    campuses: ['CUET', 'KUET', 'RUET', 'IUT', 'SUST', 'BUTEX'],
  },
  'Squad D': {
    cluster: 'Regional General Universities',
    leadPortfolio: 'Lead 4 · Brand & Digital Publicity Lead',
    coverage:
      'Public and private general universities across major regional divisions.',
    campuses: [
      'Rajshahi University',
      'Chittagong University',
      'Jahangirnagar Univ',
      'Khulna University',
      'Comilla University',
    ],
  },
  'Squad E': {
    cluster: 'Polytechnic & Emerging Campuses',
    leadPortfolio: 'Lead 5 · Campus Partnerships & Events Lead',
    coverage:
      'Diploma engineering institutes, polytechnics, colleges, and newly onboarded campuses.',
    campuses: [
      'Dhaka Polytechnic Institute',
      'BUBT',
      'Green University',
      'Chattogram Polytechnic',
      'Sylhet Polytechnic',
    ],
  },
};

export const DEFAULT_DB: PortalDB = {
  kpiWeights: {
    workshopReg: 15,
    techLead: 40,
    brandPost: 5,
    clubEvent: 30,
    certThreshold: 120,
  },
  chairName: 'Md. Adnan Chowdhury Ifti',
  secretaryName: 'Tahmid Hasan (Acting Secretary)',
  roster: [
    {
      id: 'ca1',
      name: 'Muntasir Rahman',
      campus: 'North South University',
      squad: 'Squad A',
      code: 'UE-A101',
      workshopRegs: 6,
      techLeads: 2,
      brandPosts: 9,
      clubEvents: 1,
      status: 'Active',
    },
    {
      id: 'ca2',
      name: 'Syada Nusrat',
      campus: 'North South University',
      squad: 'Squad A',
      code: 'UE-A102',
      workshopRegs: 5,
      techLeads: 1,
      brandPosts: 8,
      clubEvents: 1,
      status: 'Active',
    },
    {
      id: 'ca3',
      name: 'Farhan Sadik',
      campus: 'BUET',
      squad: 'Squad B',
      code: 'UE-B201',
      workshopRegs: 7,
      techLeads: 2,
      brandPosts: 6,
      clubEvents: 0,
      status: 'Active',
    },
    {
      id: 'ca4',
      name: 'Nafisa Tabassum',
      campus: 'AUST',
      squad: 'Squad B',
      code: 'UE-B204',
      workshopRegs: 4,
      techLeads: 1,
      brandPosts: 10,
      clubEvents: 1,
      status: 'Active',
    },
    {
      id: 'ca5',
      name: 'Rafiqul Islam',
      campus: 'CUET',
      squad: 'Squad C',
      code: 'UE-C301',
      workshopRegs: 3,
      techLeads: 3,
      brandPosts: 5,
      clubEvents: 1,
      status: 'Active',
    },
    {
      id: 'ca6',
      name: 'Tanvir Ahmed',
      campus: 'KUET',
      squad: 'Squad C',
      code: 'UE-C305',
      workshopRegs: 4,
      techLeads: 1,
      brandPosts: 7,
      clubEvents: 0,
      status: 'Active',
    },
    {
      id: 'ca7',
      name: 'Maliha Chowdhury',
      campus: 'Chittagong University',
      squad: 'Squad D',
      code: 'UE-D401',
      workshopRegs: 5,
      techLeads: 1,
      brandPosts: 9,
      clubEvents: 1,
      status: 'Active',
    },
    {
      id: 'ca8',
      name: 'Sajidul Haque',
      campus: 'Dhaka Polytechnic Institute',
      squad: 'Squad E',
      code: 'UE-E501',
      workshopRegs: 4,
      techLeads: 1,
      brandPosts: 6,
      clubEvents: 1,
      status: 'Active',
    },
  ],
  workshops: [
    {
      id: 'ws1',
      title: 'Industrial SCADA & ESP32 Telemetry Bootcamp',
      date: 'Dec 06, 2026',
      mode: 'Hybrid · Dhaka & Live',
      fee: 'BDT 500 (CA Discount)',
      seats: 60,
      regs: 42,
      tag: 'NGX / Automation',
    },
    {
      id: 'ws2',
      title: 'Solar PV Microgrid & EV Power Systems Lab',
      date: 'Dec 14, 2026',
      mode: 'Hands-on Workshop',
      fee: 'BDT 650',
      seats: 45,
      regs: 31,
      tag: 'Energy & Control',
    },
    {
      id: 'ws3',
      title: 'FYDP Hardware Architecture & PCB Prototyping Clinic',
      date: 'Dec 21, 2026',
      mode: 'Online Live + Q&A',
      fee: 'Free for CA Referrals',
      seats: 120,
      regs: 78,
      tag: 'Engineering Training',
    },
  ],
  submissions: [
    {
      id: 'sub1',
      caCode: 'UE-A101',
      caName: 'Muntasir Rahman',
      squad: 'Squad A',
      type: 'Workshop Reg',
      detail:
        'Referral enrollment for Industrial SCADA Bootcamp (Participant: Arif Hossain, AIUB)',
      date: '2026-11-21',
      status: 'Pending',
    },
    {
      id: 'sub2',
      caCode: 'UE-C301',
      caName: 'Rafiqul Islam',
      squad: 'Squad C',
      type: 'Tech Lead',
      detail:
        'FYDP 4-member EEE team needing custom BLDC motor controller & sensor dashboard',
      date: '2026-11-21',
      status: 'Pending',
    },
    {
      id: 'sub3',
      caCode: 'UE-B204',
      caName: 'Nafisa Tabassum',
      squad: 'Squad B',
      type: 'Brand Post',
      detail:
        'Shared SCADA Bootcamp poster in AUST EEE & Robotics group (1.4k reach)',
      date: '2026-11-20',
      status: 'Approved',
    },
  ],
  techPipeline: [
    {
      id: 'UE-LEAD-2026-101',
      title: 'Smart Solar Inverter Monitoring FYDP',
      campus: 'CUET',
      submittedBy: 'Rafiqul Islam (UE-C301)',
      stage: 'Handoff to UE',
      value: 'Hardware + Firmware',
    },
    {
      id: 'UE-LEAD-2026-102',
      title: 'Autonomous Line-Following Industrial AGV',
      campus: 'North South University',
      submittedBy: 'Muntasir Rahman (UE-A101)',
      stage: 'Qualified',
      value: 'Robotics Consulting',
    },
    {
      id: 'UE-LEAD-2026-103',
      title: 'IoT Pump Vibration SCADA Testbed',
      campus: 'BUET',
      submittedBy: 'Farhan Sadik (UE-B201)',
      stage: 'New',
      value: 'Sensor & Cloud Integration',
    },
  ],
  campaignKits: [
    {
      id: 'kit1',
      title: 'SCADA & Industrial AI Bootcamp — LinkedIn & Group Caption',
      author: 'Lead 4 · Brand & PR',
      date: '2026-11-20',
      copy: 'Ready to bridge university EEE/CSE theory with real industrial automation? Join Ulterior Engineering’s hands-on Industrial SCADA & ESP32 Telemetry Bootcamp! Register via my campus link below for priority student access. #UlteriorEngineering #SCADA #EngineeringBangladesh',
    },
    {
      id: 'kit2',
      title: 'FYDP & Thesis Hardware Support — Consultative Outreach Script',
      author: 'Lead 3 · Tech Lead-Gen',
      date: '2026-11-19',
      copy: 'Hey! Saw your senior design team is working on a hardware/energy prototype this semester. Ulterior Engineering mentors FYDP teams on PCB design, embedded telemetry, and industrial testing—happy to connect you for a quick technical scoping chat if helpful!',
    },
  ],
  applications: [
    {
      id: 'app1',
      name: 'Nabil Mahmud',
      role: 'Program Secretary',
      campus: 'North South University',
      squad: 'Squad A',
      email: 'nabil@nsu.edu',
      exp: 'Former General Secretary at campus Robotics Club; managed 40+ volunteers and weekly KPI trackers.',
      status: 'Pending',
    },
    {
      id: 'app2',
      name: 'Tasnim Jahan',
      role: 'Brand & Digital Publicity Lead',
      campus: 'BRAC University',
      squad: 'Squad D',
      email: 'tasnim@bracu.ac.bd',
      exp: 'Media Coordinator for IEEE Student Branch; led 12 digital technical campaigns.',
      status: 'Pending',
    },
    {
      id: 'app3',
      name: 'Zayed Al-Mamun',
      role: 'General Campus Ambassador',
      campus: 'RUET',
      squad: 'Squad C',
      email: 'zayed@ruet.ac.bd',
      exp: 'Active EEE sophomore connecting senior FYDP teams and organizing robotics workshops.',
      status: 'Pending',
    },
  ],
  certificates: [
    {
      id: 'UE-EXCOM-2026-001',
      holder: 'Md. Adnan Chowdhury Ifti',
      role: 'Program Chair (Campus Ambassador Lead)',
      campus: 'North South University',
      issued: '2026-11-01',
      status: 'Valid',
    },
    {
      id: 'UE-CA-2026-001',
      holder: 'Muntasir Rahman',
      role: 'Campus Ambassador — Squad A Top Performer',
      campus: 'North South University',
      issued: '2026-11-15',
      status: 'Valid',
    },
    {
      id: 'UE-CA-2026-002',
      holder: 'Rafiqul Islam',
      role: 'Campus Ambassador — Tech Lead-Gen Distinction',
      campus: 'CUET',
      issued: '2026-11-18',
      status: 'Valid',
    },
  ],
  workshopRegistrations: [],
  roleAssignments: [],
  clubPitches: [
    {
      id: 'cp1',
      club: 'IEEE NSU Student Branch',
      university: 'North South University',
      contact: 'Events Wing',
      type: 'Joint Technical Seminar',
      date: '2026-11-18',
      status: 'New',
    },
  ],
};

export function calcPoints(ca: Ambassador, weights: KpiWeights): number {
  return (
    ca.workshopRegs * weights.workshopReg +
    ca.techLeads * weights.techLead +
    ca.brandPosts * weights.brandPost +
    (ca.clubEvents || 0) * weights.clubEvent
  );
}

export function loadPortalDB(): PortalDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PortalDB;
      if (parsed && Array.isArray(parsed.roster) && parsed.kpiWeights) {
        return parsed;
      }
    }
  } catch {
    // Fallback to default seed
  }
  return JSON.parse(JSON.stringify(DEFAULT_DB)) as PortalDB;
}
