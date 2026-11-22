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

export type AuthSignInMode = 'standard' | 'executive' | 'developer';

export type UserRole =
  | 'developer'
  | 'chair'
  | 'ceo'
  | 'secretary'
  | 'lead1'
  | 'lead2'
  | 'lead3'
  | 'lead4'
  | 'lead5'
  | 'ca';

export type LeadRole = 'lead1' | 'lead2' | 'lead3' | 'lead4' | 'lead5';

export type RecruitmentRoleKey =
  | 'secretary'
  | 'lead1'
  | 'lead2'
  | 'lead3'
  | 'lead4'
  | 'lead5'
  | 'ca';

export type RecruitmentStatusMap = Record<RecruitmentRoleKey, boolean>;

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
  id: LeadRole;
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

export interface RoleAssignment {
  id: string; // normalized email key
  email: string;
  displayName: string;
  role: UserRole;
  squad: 'ALL' | SquadName;
  caCode: string;
  campus: string;
  assignedBy: string;
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
  status: 'Active' | 'Inactive';
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

export interface WorkshopRegistration {
  id: string;
  workshopId: string;
  workshopTitle: string;
  participantName: string;
  university: string;
  email: string;
  refCode: string;
  registrarUid: string;
}

export type SubmissionType = 'Workshop Reg' | 'Tech Lead' | 'Brand Post';
export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ActivitySubmission {
  id: string;
  caCode: string;
  caName: string;
  submitterUid?: string;
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
  submitterUid?: string;
  stage: TechPipelineStage;
  value: string;
}

export interface CampaignKit {
  id: string;
  title: string;
  author: string;
  date: string;
  copy: string;
  createdByUid?: string;
}

export interface RecruitmentApplication {
  id: string;
  name: string;
  role: string;
  campus: string;
  squad: SquadName;
  email: string;
  applicantUid?: string;
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

export type ClubPitchStatus = 'New' | 'In Review' | 'Confirmed';

export interface ClubPitch {
  id: string;
  club: string;
  university: string;
  contact: string;
  type: string;
  date: string;
  status: ClubPitchStatus;
  submitterUid?: string;
}

export interface PortalDB {
  kpiWeights: KpiWeights;
  chairName: string;
  ceoName: string;
  secretaryName: string;
  recruitmentStatus: RecruitmentStatusMap;
  roster: Ambassador[];
  workshops: Workshop[];
  workshopRegistrations: WorkshopRegistration[];
  submissions: ActivitySubmission[];
  techPipeline: TechLeadTicket[];
  campaignKits: CampaignKit[];
  applications: RecruitmentApplication[];
  certificates: CertificateRecord[];
  clubPitches: ClubPitch[];
  roleAssignments: RoleAssignment[];
}

export interface PortalUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
  assigned: boolean;
  isMainDeveloper: boolean;
  role: UserRole | null;
  squad: 'ALL' | SquadName | null;
  caCode: string;
  campus: string;
}
