/**
 * Dirty Dozen Security Test Specification for Ulterior Engineering CA Portal
 * Verifies two-email Main Developer supremacy, secondary Developer ceilings,
 * Chair & CEO parity without privilege escalation, and server-side recruitment closure.
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
    id: 4,
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
    id: 5,
    name: 'Unverified Main Developer email spoofing attack',
    actor: { uid: 'spoof-1', email: 'mdadnanchowdhuryifti@gmail.com', email_verified: false },
    operation: 'update',
    path: 'settings/program',
    payload: { workshopReg: 99 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Cross-Lead segment breach (Lead 1 -> Tech Pipeline)',
    actor: { uid: 'lead1-uid', email: 'lead1@gmail.com', email_verified: true, assignedRole: 'lead1' },
    operation: 'update',
    path: 'tech_pipeline/UE-LEAD-2026-101',
    payload: { stage: 'Handoff to UE' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Cross-Squad submission approval (Lead 2 -> Squad A)',
    actor: { uid: 'lead2-uid', email: 'lead2@gmail.com', email_verified: true, assignedRole: 'lead2' },
    operation: 'update',
    path: 'submissions/sub_squad_a',
    payload: { status: 'Approved' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Secretary attempts to toggle recruitmentStatus in settings/program',
    actor: { uid: 'sec-uid', email: 'sec@gmail.com', email_verified: true, assignedRole: 'secretary' },
    operation: 'update',
    path: 'settings/program',
    payload: {
      recruitmentStatus: {
        secretary: false,
        lead1: true,
        lead2: true,
        lead3: true,
        lead4: true,
        lead5: true,
        ca: true,
      },
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Chair attempts to overwrite ceoName or inject shadow field into recruitmentStatus',
    actor: { uid: 'chair-1', email: 'chair@gmail.com', email_verified: true, assignedRole: 'chair' },
    operation: 'update',
    path: 'settings/program',
    payload: {
      ceoName: 'Hijacked CEO',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Identity spoofing on recruitment application',
    actor: { uid: 'attacker-uid', email: 'attacker@gmail.com', email_verified: true },
    operation: 'create',
    path: 'applications/app_spoof',
    payload: {
      name: 'Spoofer',
      role: 'General Campus Ambassador',
      campus: 'NSU',
      squad: 'Squad A',
      email: 'victim@gmail.com',
      applicantUid: 'victim-uid',
      exp: 'Forged experience',
      status: 'Pending',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'PII scraping on other users recruitment applications',
    actor: { uid: 'ca-uid', email: 'ca@gmail.com', email_verified: true, assignedRole: 'ca' },
    operation: 'get',
    path: 'applications/other_user_app',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'ID poisoning on certificate write and terminal state re-opening',
    actor: { uid: 'dev-uid', email: 'adnanchowdhury477@gmail.com', email_verified: true },
    operation: 'create',
    path: 'certificates/evil$id_with_invalid_chars',
    payload: { holder: 'Bad', role: 'Bad', campus: 'Bad', issued: '2026-11-22', status: 'Valid' },
    expected: 'PERMISSION_DENIED',
  },
];
