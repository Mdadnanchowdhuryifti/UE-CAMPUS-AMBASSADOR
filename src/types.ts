export type SquadName = 'Squad A' | 'Squad B' | 'Squad C' | 'Squad D' | 'Squad E';

export type GovernanceNodeKey =
  | 'chair'
  | 'secretary'
  | 'lead1'
  | 'lead2'
  | 'lead3'
  | 'lead4'
  | 'lead5'
  | 'general';

export type UserRole = 'chair' | 'secretary' | 'lead' | 'ca';

export interface GovernanceNode {
  tier: string;
  excom: string;
  title: string;
  reporting: string;
  mandate: string;
  kpis: string[];
  applyRole: string;
  cta: string;
}

export interface CoreLeadMeta {
  id: GovernanceNodeKey;
  num: string;
  title: string;
  squad: SquadName;
  excom: string;
  desc: string;
}

export interface SquadMeta {
  cluster: string;
  leadPortfolio: string;
  coverage: string;
  campuses: string[];
}

export interface KpiWeights {
  workshopReg: number;
  techLead: number;
  brandPost: number;
  clubEvent: number;
  certThreshold: number;
}

export interface Ambassador {
  id: string;
  name: string;
  campus: string;
  squad: SquadName;
  code: string;
  workshopRegs: number;
  techLeads: number;
  brandPosts: number;
  clubEvents: number;
  status: string;
}

export interface Workshop {
  id: string;
  title: string;
  date: string;
  mode: string;
  fee: string;
  seats: number;
  regs: number;
  tag: string;
}

export type SubmissionType = 'Workshop Reg' | 'Tech Lead' | 'Brand Post';
export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ActivitySubmission {
  id: string;
  caCode: string;
  caName: string;
  squad: SquadName;
  type: SubmissionType;
  detail: string;
  date: string;
  status: ReviewStatus;
}

export type TechPipelineStage = 'New' | 'Qualified' | 'Handoff to UE';

export interface TechLeadTicket {
  id: string;
  title: string;
  campus: string;
  submittedBy: string;
  stage: TechPipelineStage;
  value: string;
}

export interface CampaignKit {
  id: string;
  title: string;
  author: string;
  date: string;
  copy: string;
}

export interface RecruitmentApplication {
  id: string;
  name: string;
  role: string;
  campus: string;
  squad: SquadName;
  email: string;
  exp: string;
  status: ReviewStatus;
}

export interface CertificateRecord {
  id: string;
  holder: string;
  role: string;
  campus: string;
  issued: string;
  status: 'Valid' | 'Revoked';
}

export interface ClubPitch {
  id: string;
  club: string;
  university: string;
  contact: string;
  type: string;
  date: string;
}

export interface PortalDB {
  kpiWeights: KpiWeights;
  secretaryName: string;
  roster: Ambassador[];
  workshops: Workshop[];
  submissions: ActivitySubmission[];
  techPipeline: TechLeadTicket[];
  campaignKits: CampaignKit[];
  applications: RecruitmentApplication[];
  certificates: CertificateRecord[];
  clubPitches: ClubPitch[];
}

export interface PortalUser {
  role: UserRole;
  name: string;
  sub: string;
  caCode?: string;
  squad?: SquadName;
}
