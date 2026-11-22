/**
 * Dirty Dozen Security Test Specification for Ulterior Engineering CA Portal
 * Verifies Tier 0 Developer supremacy, Developer-only Chair appointment,
 * strict Lead 1-5 segment isolation, PII isolation, and schema invariants.
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
    name: 'Chair attempts privilege escalation to Developer',
    actor: { uid: 'chair-1', email: 'chair@gmail.com', email_verified: true, assignedRole: 'chair' },
    operation: 'create',
    path: 'role_assignments/chair_at_gmail_com',
    payload: {
      email: 'chair@gmail.com',
      displayName: 'Chair Escalation',
      role: 'developer',
      squad: 'ALL',
      caCode: '',
      campus: 'NSU',
      assignedBy: 'chair-1',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Chair attempts to appoint another Program Chair (Developer-only action)',
    actor: { uid: 'chair-1', email: 'chair@gmail.com', email_verified: true, assignedRole: 'chair' },
    operation: 'create',
    path: 'role_assignments/peer_at_gmail_com',
    payload: {
      email: 'peer@gmail.com',
      displayName: 'Unauthorized Chair',
      role: 'chair',
      squad: 'ALL',
      caCode: '',
      campus: 'NSU',
      assignedBy: 'chair-1',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Developer email spoofing attack',
    actor: { uid: 'spoof-1', email: 'adnanchowdhury477@gmail.com', email_verified: false },
    operation: 'update',
    path: 'settings/program',
    payload: { workshopReg: 99 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Cross-Lead segment breach (Lead 1 -> Tech Pipeline)',
    actor: { uid: 'lead1-uid', email: 'lead1@gmail.com', email_verified: true, assignedRole: 'lead1' },
    operation: 'update',
    path: 'tech_pipeline/UE-LEAD-2026-101',
    payload: { stage: 'Handoff to UE' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Cross-Squad submission approval (Lead 2 -> Squad A)',
    actor: { uid: 'lead2-uid', email: 'lead2@gmail.com', email_verified: true, assignedRole: 'lead2' },
    operation: 'update',
    path: 'submissions/sub_squad_a',
    payload: { status: 'Approved' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Secretary privilege escalation to issue certificate',
    actor: { uid: 'sec-uid', email: 'sec@gmail.com', email_verified: true, assignedRole: 'secretary' },
    operation: 'create',
    path: 'certificates/UE-CA-2026-999',
    payload: {
      holder: 'Fake Cert',
      role: 'Chair',
      campus: 'NSU',
      issued: '2026-11-22',
      status: 'Valid',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Shadow field injection on submission create',
    actor: { uid: 'ca-uid', email: 'ca@gmail.com', email_verified: true, assignedRole: 'ca' },
    operation: 'create',
    path: 'submissions/sub_shadow',
    payload: {
      caCode: 'UE-A101',
      caName: 'Test CA',
      submitterUid: 'ca-uid',
      squad: 'Squad A',
      type: 'Brand Post',
      detail: 'Valid link',
      date: '2026-11-22',
      status: 'Pending',
      isVerified: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Status pre-approval spoofing on submission create',
    actor: { uid: 'ca-uid', email: 'ca@gmail.com', email_verified: true, assignedRole: 'ca' },
    operation: 'create',
    path: 'submissions/sub_preapproved',
    payload: {
      caCode: 'UE-A101',
      caName: 'Test CA',
      submitterUid: 'ca-uid',
      squad: 'Squad A',
      type: 'Brand Post',
      detail: 'Valid link',
      date: '2026-11-22',
      status: 'Approved',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Identity spoofing on recruitment application',
    actor: { uid: 'attacker-uid', email: 'attacker@gmail.com', email_verified: true },
    operation: 'create',
    path: 'applications/app_spoof',
    payload: {
      name: 'Spoofer',
      role: 'Program Secretary',
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
    id: 10,
    name: 'PII scraping on other users recruitment applications',
    actor: { uid: 'ca-uid', email: 'ca@gmail.com', email_verified: true, assignedRole: 'ca' },
    operation: 'get',
    path: 'applications/other_user_app',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal state re-opening by Core Lead',
    actor: { uid: 'lead1-uid', email: 'lead1@gmail.com', email_verified: true, assignedRole: 'lead1' },
    operation: 'update',
    path: 'submissions/already_approved_sub',
    payload: { status: 'Pending' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'ID poisoning on certificate write',
    actor: { uid: 'dev-uid', email: 'adnanchowdhury477@gmail.com', email_verified: true },
    operation: 'create',
    path: 'certificates/evil$id_with_invalid_chars',
    payload: { holder: 'Bad', role: 'Bad', campus: 'Bad', issued: '2026-11-22', status: 'Valid' },
    expected: 'PERMISSION_DENIED',
  },
];
