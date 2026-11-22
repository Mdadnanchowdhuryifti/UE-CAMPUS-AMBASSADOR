import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  normalizeEmailKey,
  OperationType,
} from '../lib/firebase';
import { DEFAULT_DB } from '../data/playbook';
import {
  Ambassador,
  CertificateRecord,
  ClubPitchStatus,
  KpiWeights,
  LeadRole,
  RoleAssignment,
  SquadName,
  SubmissionType,
  TechPipelineStage,
  UserRole,
} from '../types';

export const LEAD_TO_SQUAD: Record<LeadRole, SquadName> = {
  lead1: 'Squad A',
  lead2: 'Squad B',
  lead3: 'Squad C',
  lead4: 'Squad D',
  lead5: 'Squad E',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  developer: 'Tier 0 · Platform Developer (Root Full Control)',
  chair: 'Tier 1 · Program Chair (Developer-Appointed · Full Access)',
  secretary: 'Tier 2 · Program Secretary',
  lead1: 'Tier 3 · Lead 1 (Operations & CA HR · Squad A)',
  lead2: 'Tier 3 · Lead 2 (Workshop & Growth · Squad B)',
  lead3: 'Tier 3 · Lead 3 (Tech Lead-Gen · Squad C)',
  lead4: 'Tier 3 · Lead 4 (Brand & Digital PR · Squad D)',
  lead5: 'Tier 3 · Lead 5 (Clubs & Events · Squad E)',
  ca: 'Tier 4 · General Campus Ambassador',
};

export function isFullAccessRole(role: UserRole | null): boolean {
  return role === 'developer' || role === 'chair';
}

export function mapApplicationRoleToUserRole(roleTitle: string): UserRole {
  const r = roleTitle.toLowerCase();
  if (r.includes('secretary')) return 'secretary';
  if (r.includes('operations') || r.includes('hr')) return 'lead1';
  if (r.includes('workshop') || r.includes('growth')) return 'lead2';
  if (r.includes('technical') || r.includes('lead-gen')) return 'lead3';
  if (r.includes('brand') || r.includes('publicity') || r.includes('pr')) return 'lead4';
  if (r.includes('partnership') || r.includes('events') || r.includes('club')) return 'lead5';
  return 'ca';
}

function clamp(str: string, max: number): string {
  return str.trim().slice(0, max);
}

function safeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`.replace(
    /[^a-zA-Z0-9_-]/g,
    '_'
  );
}

/**
 * Populates Firestore with clean initial program data when the Program Chair first launches an empty DB.
 */
export async function seedInitialFirestoreData(): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  const email = auth.currentUser?.email;
  if (!uid || !email) return false;

  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'program'));
    if (settingsSnap.exists()) return false;

    const batch = writeBatch(db);

    // 1. Program Settings
    batch.set(doc(db, 'settings', 'program'), {
      workshopReg: DEFAULT_DB.kpiWeights.workshopReg,
      techLead: DEFAULT_DB.kpiWeights.techLead,
      brandPost: DEFAULT_DB.kpiWeights.brandPost,
      clubEvent: DEFAULT_DB.kpiWeights.clubEvent,
      certThreshold: DEFAULT_DB.kpiWeights.certThreshold,
      secretaryName: DEFAULT_DB.secretaryName,
      chairName: DEFAULT_DB.chairName,
      updatedAt: serverTimestamp(),
    });

    // 2. Root Developer Role Assignment
    const devKey = normalizeEmailKey(email);
    batch.set(doc(db, 'role_assignments', devKey), {
      email: email.toLowerCase(),
      displayName: clamp(auth.currentUser?.displayName || 'Platform Developer', 120),
      role: 'developer',
      squad: 'ALL',
      caCode: 'UE-DEV-00',
      campus: 'Ulterior Engineering HQ',
      assignedBy: uid,
      updatedAt: serverTimestamp(),
    });

    // 3. Initial Non-PII Ambassador Roster
    for (const amb of DEFAULT_DB.roster) {
      batch.set(doc(db, 'ambassadors', amb.id), {
        name: amb.name,
        campus: amb.campus,
        squad: amb.squad,
        code: amb.code,
        workshopRegs: amb.workshopRegs,
        techLeads: amb.techLeads,
        brandPosts: amb.brandPosts,
        clubEvents: amb.clubEvents,
        status: amb.status,
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Initial Workshops
    for (const ws of DEFAULT_DB.workshops) {
      batch.set(doc(db, 'workshops', ws.id), {
        title: ws.title,
        date: ws.date,
        mode: ws.mode,
        fee: ws.fee,
        seats: ws.seats,
        regs: ws.regs,
        tag: ws.tag,
        createdAt: serverTimestamp(),
      });
    }

    // 5. Initial Verifiable Certificates
    for (const cert of DEFAULT_DB.certificates) {
      batch.set(doc(db, 'certificates', cert.id), {
        holder: cert.holder,
        role: cert.role,
        campus: cert.campus,
        issued: cert.issued,
        status: cert.status,
        createdAt: serverTimestamp(),
      });
    }

    // 6. Initial Campaign Kits
    for (const kit of DEFAULT_DB.campaignKits) {
      batch.set(doc(db, 'campaign_kits', kit.id), {
        title: kit.title,
        author: kit.author,
        date: kit.date,
        copy: kit.copy,
        createdByUid: uid,
        createdAt: serverTimestamp(),
      });
    }

    // 7. Initial Tech Pipeline Tickets
    for (const ticket of DEFAULT_DB.techPipeline) {
      batch.set(doc(db, 'tech_pipeline', ticket.id), {
        title: ticket.title,
        campus: ticket.campus,
        submittedBy: ticket.submittedBy,
        submitterUid: uid,
        stage: ticket.stage,
        value: ticket.value,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/program');
  }
}

export async function saveProgramSettings(
  weights: KpiWeights,
  secretaryName: string
): Promise<void> {
  const payload = {
    workshopReg: Math.max(0, Math.min(500, Math.round(weights.workshopReg))),
    techLead: Math.max(0, Math.min(1000, Math.round(weights.techLead))),
    brandPost: Math.max(0, Math.min(200, Math.round(weights.brandPost))),
    clubEvent: Math.max(0, Math.min(500, Math.round(weights.clubEvent))),
    certThreshold: Math.max(10, Math.min(10000, Math.round(weights.certThreshold))),
    secretaryName: clamp(secretaryName || 'General Secretary', 120),
    updatedAt: serverTimestamp(),
  };

  try {
    const ref = doc(db, 'settings', 'program');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, {
        ...payload,
        chairName: DEFAULT_DB.chairName,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'settings/program');
  }
}

export async function upsertRoleAssignment(input: {
  email: string;
  displayName: string;
  role: UserRole;
  squad: 'ALL' | SquadName;
  caCode: string;
  campus: string;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in required.');

  const cleanEmail = clamp(input.email.toLowerCase(), 160);
  const emailKey = normalizeEmailKey(cleanEmail);
  const derivedSquad: 'ALL' | SquadName =
    input.role === 'developer' || input.role === 'chair' || input.role === 'secretary'
      ? 'ALL'
      : input.role === 'ca'
      ? input.squad === 'ALL'
        ? 'Squad A'
        : input.squad
      : LEAD_TO_SQUAD[input.role];

  const cleanCode = clamp(input.caCode.toUpperCase().replace(/[^A-Z0-9-]/g, ''), 32);

  try {
    await setDoc(doc(db, 'role_assignments', emailKey), {
      email: cleanEmail,
      displayName: clamp(input.displayName, 120),
      role: input.role,
      squad: derivedSquad,
      caCode: cleanCode,
      campus: clamp(input.campus || 'Ulterior Engineering', 120),
      assignedBy: uid,
      updatedAt: serverTimestamp(),
    });

    if (input.role === 'chair') {
      const settingsRef = doc(db, 'settings', 'program');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        await updateDoc(settingsRef, {
          chairName: clamp(input.displayName, 120),
          updatedAt: serverTimestamp(),
        });
      }
    }

    if (input.role === 'secretary') {
      const settingsRef = doc(db, 'settings', 'program');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        await updateDoc(settingsRef, {
          secretaryName: clamp(
            `${input.displayName}${input.campus ? ` (${input.campus})` : ''}`,
            120
          ),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `role_assignments/${emailKey}`);
  }
}

export async function removeRoleAssignment(emailKey: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'role_assignments', emailKey));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `role_assignments/${emailKey}`);
  }
}

export async function addOrUpdateAmbassador(amb: Omit<Ambassador, 'id'> & { id?: string }): Promise<void> {
  const id = amb.id || safeId('ca');
  try {
    await setDoc(doc(db, 'ambassadors', id), {
      name: clamp(amb.name, 120),
      campus: clamp(amb.campus, 120),
      squad: amb.squad,
      code: clamp(amb.code.toUpperCase().replace(/[^A-Z0-9-]/g, ''), 32),
      workshopRegs: Math.max(0, Math.min(5000, amb.workshopRegs)),
      techLeads: Math.max(0, Math.min(5000, amb.techLeads)),
      brandPosts: Math.max(0, Math.min(5000, amb.brandPosts)),
      clubEvents: Math.max(0, Math.min(5000, amb.clubEvents)),
      status: amb.status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `ambassadors/${id}`);
  }
}

export async function createWorkshopDoc(input: {
  title: string;
  date: string;
  mode: string;
  fee: string;
  seats: number;
  tag: string;
}): Promise<void> {
  const id = safeId('ws');
  try {
    await setDoc(doc(db, 'workshops', id), {
      title: clamp(input.title, 160),
      date: clamp(input.date, 60),
      mode: clamp(input.mode || 'Ulterior Engineering Official', 80),
      fee: clamp(input.fee, 60),
      seats: Math.max(1, Math.min(5000, input.seats || 60)),
      regs: 0,
      tag: clamp(input.tag || 'New Launch', 60),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `workshops/${id}`);
  }
}

export async function submitWorkshopRegistrationDoc(input: {
  workshopId: string;
  workshopTitle: string;
  participantName: string;
  university: string;
  email: string;
  refCode: string;
  roster: Ambassador[];
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Please sign in with Google to register.');

  const regId = safeId('reg');
  const cleanRef = clamp(input.refCode.toUpperCase().replace(/[^A-Z0-9-]/g, ''), 32);

  try {
    const wsRef = doc(db, 'workshops', input.workshopId);
    const wsSnap = await getDoc(wsRef);
    const currentRegs = wsSnap.exists() ? Number(wsSnap.data().regs || 0) : 0;

    const batch = writeBatch(db);
    batch.set(doc(db, 'workshop_registrations', regId), {
      workshopId: input.workshopId,
      workshopTitle: clamp(input.workshopTitle, 160),
      participantName: clamp(input.participantName, 120),
      university: clamp(input.university, 120),
      email: clamp(input.email.toLowerCase(), 160),
      refCode: cleanRef,
      registrarUid: uid,
      createdAt: serverTimestamp(),
    });

    if (wsSnap.exists()) {
      batch.update(wsRef, { regs: currentRegs + 1 });
    }

    if (cleanRef.length >= 3) {
      const ca = input.roster.find((r) => r.code.toUpperCase() === cleanRef);
      const subId = safeId('sub');
      batch.set(doc(db, 'submissions', subId), {
        caCode: cleanRef,
        caName: clamp(ca ? ca.name : 'External Referral', 120),
        submitterUid: uid,
        squad: ca ? ca.squad : 'Squad A',
        type: 'Workshop Reg',
        detail: clamp(
          `Auto-tracked registration for "${input.workshopTitle}" — Participant: ${input.participantName} (${input.university})`,
          1000
        ),
        date: new Date().toISOString().slice(0, 10),
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `workshop_registrations/${regId}`);
  }
}

export async function submitCAProofDoc(input: {
  caCode: string;
  caName: string;
  campus: string;
  squad: SquadName;
  type: SubmissionType;
  detail: string;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in required.');

  const subId = safeId('sub');
  const cleanCode = clamp(input.caCode.toUpperCase().replace(/[^A-Z0-9-]/g, ''), 32);

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'submissions', subId), {
      caCode: cleanCode,
      caName: clamp(input.caName, 120),
      submitterUid: uid,
      squad: input.squad,
      type: input.type,
      detail: clamp(input.detail, 1000),
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (input.type === 'Tech Lead') {
      const ticketId = `UE-LEAD-2026-${Math.floor(200 + Math.random() * 799)}`;
      batch.set(doc(db, 'tech_pipeline', ticketId), {
        title: clamp(input.detail.slice(0, 80), 160),
        campus: clamp(input.campus || 'Campus', 120),
        submittedBy: clamp(`${input.caName} (${cleanCode})`, 120),
        submitterUid: uid,
        stage: 'New',
        value: 'Student Inquiry',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `submissions/${subId}`);
  }
}

export async function reviewSubmissionAtomic(input: {
  subId: string;
  caCode: string;
  type: SubmissionType;
  decision: 'Approved' | 'Rejected';
  roster: Ambassador[];
}): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'submissions', input.subId), {
      status: input.decision,
      updatedAt: serverTimestamp(),
    });

    if (input.decision === 'Approved') {
      const ca = input.roster.find(
        (r) => r.code.toUpperCase() === input.caCode.toUpperCase()
      );
      if (ca) {
        const updateFields: Record<string, unknown> = {
          updatedAt: serverTimestamp(),
        };
        if (input.type === 'Workshop Reg') {
          updateFields.workshopRegs = ca.workshopRegs + 1;
        } else if (input.type === 'Tech Lead') {
          updateFields.techLeads = ca.techLeads + 1;
        } else {
          updateFields.brandPosts = ca.brandPosts + 1;
        }
        batch.update(doc(db, 'ambassadors', ca.id), updateFields);
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `submissions/${input.subId}`);
  }
}

export async function updateTechLeadStageDoc(
  ticketId: string,
  stage: TechPipelineStage
): Promise<void> {
  try {
    await updateDoc(doc(db, 'tech_pipeline', ticketId), {
      stage,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tech_pipeline/${ticketId}`);
  }
}

export async function publishCampaignKitDoc(input: {
  title: string;
  author: string;
  copy: string;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in required.');
  const id = safeId('kit');
  try {
    await setDoc(doc(db, 'campaign_kits', id), {
      title: clamp(input.title, 160),
      author: clamp(input.author, 120),
      date: new Date().toISOString().slice(0, 10),
      copy: clamp(input.copy, 2000),
      createdByUid: uid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `campaign_kits/${id}`);
  }
}

export async function deleteCampaignKitDoc(kitId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'campaign_kits', kitId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `campaign_kits/${kitId}`);
  }
}

export async function submitApplicationDoc(input: {
  name: string;
  role: string;
  campus: string;
  squad: SquadName;
  email: string;
  exp: string;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  const authEmail = auth.currentUser?.email;
  if (!uid || !authEmail) throw new Error('Please sign in with Google to submit your application.');

  const id = safeId('app');
  try {
    await setDoc(doc(db, 'applications', id), {
      name: clamp(input.name, 120),
      role: clamp(input.role, 100),
      campus: clamp(input.campus, 120),
      squad: input.squad,
      email: clamp(authEmail.toLowerCase(), 160),
      applicantUid: uid,
      exp: clamp(input.exp, 1500),
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `applications/${id}`);
  }
}

export async function approveApplicationAndOnboard(app: {
  id: string;
  name: string;
  role: string;
  campus: string;
  squad: SquadName;
  email: string;
}, isChairActor: boolean): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in required.');

  try {
    await updateDoc(doc(db, 'applications', app.id), {
      status: 'Approved',
      updatedAt: serverTimestamp(),
    });

    if (!isChairActor) return;

    const assignedRole = mapApplicationRoleToUserRole(app.role);
    const squadLetter = app.squad.split(' ')[1] || 'A';
    const newCode = `UE-${squadLetter}${Math.floor(300 + Math.random() * 699)}`;

    await upsertRoleAssignment({
      email: app.email,
      displayName: app.name,
      role: assignedRole,
      squad: assignedRole === 'secretary' ? 'ALL' : app.squad,
      caCode: assignedRole === 'ca' ? newCode : `UE-${assignedRole.toUpperCase()}`,
      campus: app.campus,
    });

    if (assignedRole === 'ca') {
      await addOrUpdateAmbassador({
        name: app.name,
        campus: app.campus,
        squad: app.squad,
        code: newCode,
        workshopRegs: 0,
        techLeads: 0,
        brandPosts: 1,
        clubEvents: 0,
        status: 'Active',
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `applications/${app.id}`);
  }
}

export async function rejectApplicationDoc(appId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'applications', appId), {
      status: 'Rejected',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
  }
}

export async function issueCertificateDoc(input: {
  holder: string;
  campus: string;
  role: string;
  existingCount: number;
}): Promise<string> {
  const id = `UE-CA-2026-${String(input.existingCount + 1).padStart(3, '0')}`;
  try {
    await setDoc(doc(db, 'certificates', id), {
      holder: clamp(input.holder, 120),
      campus: clamp(input.campus, 120),
      role: clamp(input.role, 140),
      issued: new Date().toISOString().slice(0, 10),
      status: 'Valid',
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `certificates/${id}`);
  }
}

export async function toggleCertificateStatusDoc(
  id: string,
  currentStatus: 'Valid' | 'Revoked'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'certificates', id), {
      status: currentStatus === 'Valid' ? 'Revoked' : 'Valid',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `certificates/${id}`);
  }
}

export async function verifyCertificateById(
  rawId: string
): Promise<CertificateRecord | null> {
  const cleanId = rawId.trim().toUpperCase();
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(cleanId)) return null;
  try {
    const snap = await getDoc(doc(db, 'certificates', cleanId));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: snap.id,
      holder: String(d.holder || ''),
      role: String(d.role || ''),
      campus: String(d.campus || ''),
      issued: String(d.issued || ''),
      status: d.status === 'Revoked' ? 'Revoked' : 'Valid',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `certificates/${cleanId}`);
  }
}

export async function submitClubPitchDoc(input: {
  club: string;
  university: string;
  contact: string;
  type: string;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Please sign in with Google to submit a partnership inquiry.');
  const id = safeId('cp');
  try {
    await setDoc(doc(db, 'club_pitches', id), {
      club: clamp(input.club, 120),
      university: clamp(input.university, 120),
      contact: clamp(input.contact, 160),
      type: clamp(input.type, 100),
      date: new Date().toISOString().slice(0, 10),
      status: 'New',
      submitterUid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `club_pitches/${id}`);
  }
}

export async function updateClubPitchStatusDoc(
  pitchId: string,
  status: ClubPitchStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'club_pitches', pitchId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `club_pitches/${pitchId}`);
  }
}

export async function fetchRoleAssignmentForEmail(
  email: string
): Promise<RoleAssignment | null> {
  const emailKey = normalizeEmailKey(email);
  try {
    const snap = await getDoc(doc(db, 'role_assignments', emailKey));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: snap.id,
      email: String(d.email || email),
      displayName: String(d.displayName || ''),
      role: d.role as UserRole,
      squad: (d.squad || 'Squad A') as 'ALL' | SquadName,
      caCode: String(d.caCode || ''),
      campus: String(d.campus || ''),
      assignedBy: String(d.assignedBy || ''),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `role_assignments/${emailKey}`);
  }
}

export async function syncRosterBatchToFirestore(
  ambassadors: Omit<Ambassador, 'id'>[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    ambassadors.forEach((amb, idx) => {
      const id = `csv_${amb.code.toLowerCase().replace(/[^a-z0-9]/g, '')}_${idx + 1}`;
      batch.set(doc(db, 'ambassadors', id), {
        name: clamp(amb.name, 120),
        campus: clamp(amb.campus, 120),
        squad: amb.squad,
        code: clamp(amb.code.toUpperCase().replace(/[^A-Z0-9-]/g, ''), 32),
        workshopRegs: Math.max(0, Math.min(5000, amb.workshopRegs)),
        techLeads: Math.max(0, Math.min(5000, amb.techLeads)),
        brandPosts: Math.max(0, Math.min(5000, amb.brandPosts)),
        clubEvents: Math.max(0, Math.min(5000, amb.clubEvents)),
        status: amb.status === 'Inactive' ? 'Inactive' : 'Active',
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'ambassadors');
  }
}

export async function fetchUserOwnApplications(uid: string) {
  try {
    const q = query(collection(db, 'applications'), where('applicantUid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'applications');
  }
}
