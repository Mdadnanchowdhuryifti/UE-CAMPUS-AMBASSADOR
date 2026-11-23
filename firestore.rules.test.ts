/**
 * Dirty Dozen Security Test Specification for Ulterior Engineering CA Portal
 * Verifies two-email Main Developer supremacy, email-to-key integrity,
 * atomic workshop seat-cap registration, non-member submission gating,
 * +1 ambassador approval bounds, and server-side recruitment closure.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  actor: {
    uid: string | null;
    email?: string;
    email_verified?: boolean;
    assignedRole?: string;
  };
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Secondary Developer attempts to add another Developer (Main Developer exclusive)',
    actor: { uid: 'sec-dev-1', email: 'added.dev@gmail.com', email_verified: true, assignedRole: 'developer' },
    operation: 'create',
    path: 'role_assignments/another_at_gmail_dot_com',
    payload: {
      email: 'another@gmail.com',
      displayName: 'Unauthorized Dev',
      role: 'developer',
      squad: 'ALL',
      caCode: 'UE-DEV-02',
      campus: 'HQ',
      assignedBy: 'sec-dev-1',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Secondary Developer attempts to delete a Main Developer account',
    actor: { uid: 'sec-dev-1', email: 'added.dev@gmail.com', email_verified: true, assignedRole: 'developer' },
    operation: 'delete',
    path: 'role_assignments/mdadnanchowdhuryifti_at_gmail_dot_com',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Role assignment document ID does not match stored email field',
    actor: { uid: 'chair-1', email: 'chair@gmail.com', email_verified: true, assignedRole: 'chair' },
    operation: 'create',
    path: 'role_assignments/alice_at_gmail_dot_com',
    payload: {
      email: 'bob@gmail.com',
      displayName: 'Mismatched User',
      role: 'ca',
      squad: 'Squad A',
      caCode: 'UE-A109',
      campus: 'NSU',
      assignedBy: 'chair-1',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Company CEO attempts to appoint another Chair or Developer',
    actor: { uid: 'ceo-1', email: 'ceo@ulteriorengineering.com', email_verified: true, assignedRole: 'ceo' },
    operation: 'create',
    path: 'role_assignments/peer_at_gmail_dot_com',
    payload: {
      email: 'peer@gmail.com',
      displayName: 'Unauthorized Chair',
      role: 'chair',
      squad: 'ALL',
      caCode: '',
      campus: 'NSU',
      assignedBy: 'ceo-1',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Applicant attempts to submit application for closed Program Secretary role',
    actor: { uid: 'cand-1', email: 'candidate@gmail.com', email_verified: true },
    operation: 'create',
    path: 'applications/app_closed_sec',
    payload: {
      name: 'Candidate One',
      role: 'Program Secretary',
      campus: 'NSU',
      squad: 'Squad A',
      email: 'candidate@gmail.com',
      applicantUid: 'cand-1',
      exp: 'Club secretary experience',
      status: 'Pending',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Unverified Main Developer email spoofing attack',
    actor: { uid: 'spoof-1', email: 'mdadnanchowdhuryifti@gmail.com', email_verified: false },
    operation: 'update',
    path: 'settings/program',
    payload: { workshopReg: 99 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Standalone workshop seat increment without atomic per-user registration',
    actor: { uid: 'user-1', email: 'student@gmail.com', email_verified: true },
    operation: 'update',
    path: 'workshops/ws1',
    payload: { regs: 45 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Unassigned user attempts to create Tech Lead or standalone Workshop Reg submission',
    actor: { uid: 'outsider-1', email: 'outsider@gmail.com', email_verified: true },
    operation: 'create',
    path: 'submissions/sub_spam_01',
    payload: {
      caCode: 'UE-A101',
      caName: 'Spoofed CA',
      submitterUid: 'outsider-1',
      squad: 'Squad A',
      type: 'Tech Lead',
      detail: 'Unassigned spam proof submission',
      date: '2026-11-22',
      status: 'Pending',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Secretary or Squad Lead attempts to jump ambassador workshopRegs by +500',
    actor: { uid: 'sec-uid', email: 'sec@gmail.com', email_verified: true, assignedRole: 'secretary' },
    operation: 'update',
    path: 'ambassadors/ca1',
    payload: { workshopRegs: 500 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Cross-Lead segment breach (Lead 1 -> Tech Pipeline) and Cross-Squad approval',
    actor: { uid: 'lead1-uid', email: 'lead1@gmail.com', email_verified: true, assignedRole: 'lead1' },
    operation: 'update',
    path: 'tech_pipeline/UE-LEAD-2026-101',
    payload: { stage: 'Handoff to UE' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Chair attempts to overwrite ceoName or Secretary toggles recruitmentStatus',
    actor: { uid: 'chair-1', email: 'chair@gmail.com', email_verified: true, assignedRole: 'chair' },
    operation: 'update',
    path: 'settings/program',
    payload: { ceoName: 'Hijacked CEO' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'PII scraping on other users recruitment applications and ID poisoning',
    actor: { uid: 'ca-uid', email: 'ca@gmail.com', email_verified: true, assignedRole: 'ca' },
    operation: 'get',
    path: 'applications/other_user_app',
    expected: 'PERMISSION_DENIED',
  },
];
