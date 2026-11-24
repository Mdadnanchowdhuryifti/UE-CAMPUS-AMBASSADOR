import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  isMainDeveloperEmail,
  MAIN_DEVELOPER_EMAIL_KEYS,
  normalizeEmailKey,
  OperationType,
} from '../lib/firebase';
import {
  AdminAuditAction,
  SystemConfig,
  SystemErrorSeverity,
  SystemErrorSource,
  UserModerationRecord,
  UserModerationStatus,
} from '../types';

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  maintenanceMode: false,
  maintenanceMessage:
    'The Ulterior Engineering Campus Ambassador Portal is undergoing scheduled maintenance. Please check back shortly.',
  emergencyLockdown: false,
  lockdownMessage:
    'Emergency Read-Only Lockdown is active. Sign-ins, applications, workshop registrations, uploads, and all write operations are temporarily suspended.',
  lockdownEpoch: 0,
  updatedByName: 'Platform Developer',
  updatedByUid: 'system',
  updatedAt: null,
};

function clamp(str: string, max: number): string {
  return str.trim().slice(0, max);
}

function safeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`.replace(
    /[^a-zA-Z0-9_-]/g,
    '_'
  );
}

export function timestampToDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

function getActorMeta() {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Verified Developer sign-in required.');
  }
  const rawName = (user.displayName || '').trim();
  const actorName = rawName.length >= 2 ? clamp(rawName, 120) : 'Platform Developer';
  return {
    uid: user.uid,
    email: clamp(user.email.toLowerCase(), 160),
    actorName,
  };
}

/**
 * Ensures config/system exists in Firestore when a Developer opens /admin.
 */
export async function ensureSystemConfigDoc(): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  try {
    const ref = doc(db, 'config', 'system');
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    const actor = getActorMeta();
    await setDoc(ref, {
      maintenanceMode: false,
      maintenanceMessage: DEFAULT_SYSTEM_CONFIG.maintenanceMessage,
      emergencyLockdown: false,
      lockdownMessage: DEFAULT_SYSTEM_CONFIG.lockdownMessage,
      lockdownEpoch: 0,
      updatedByName: actor.actorName,
      updatedByUid: actor.uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'config/system');
  }
}

/**
 * Atomically updates config/system AND writes an immutable audit_logs entry.
 */
export async function updateSystemConfigWithAudit(input: {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  emergencyLockdown: boolean;
  lockdownMessage: string;
  lockdownEpoch: number;
  auditAction: AdminAuditAction;
  auditDetails: string;
}): Promise<void> {
  const actor = getActorMeta();
  const auditId = safeId('audit');

  const safeMaintenanceMsg =
    clamp(input.maintenanceMessage, 500).length >= 5
      ? clamp(input.maintenanceMessage, 500)
      : DEFAULT_SYSTEM_CONFIG.maintenanceMessage;
  const safeLockdownMsg =
    clamp(input.lockdownMessage, 500).length >= 5
      ? clamp(input.lockdownMessage, 500)
      : DEFAULT_SYSTEM_CONFIG.lockdownMessage;

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'config', 'system'), {
      maintenanceMode: Boolean(input.maintenanceMode),
      maintenanceMessage: safeMaintenanceMsg,
      emergencyLockdown: Boolean(input.emergencyLockdown),
      lockdownMessage: safeLockdownMsg,
      lockdownEpoch: Math.max(0, Math.floor(input.lockdownEpoch)),
      updatedByName: actor.actorName,
      updatedByUid: actor.uid,
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'audit_logs', auditId), {
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorName: actor.actorName,
      action: input.auditAction,
      target: 'config/system',
      details: clamp(input.auditDetails, 1000),
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'config/system');
  }
}

/**
 * Appends a standalone immutable audit log record (Developer only).
 */
export async function writeAdminAuditLog(
  action: AdminAuditAction,
  target: string,
  details: string
): Promise<void> {
  const actor = getActorMeta();
  const auditId = safeId('audit');
  try {
    await setDoc(doc(db, 'audit_logs', auditId), {
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorName: actor.actorName,
      action,
      target: clamp(target || 'system', 160),
      details: clamp(details || action, 1000),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `audit_logs/${auditId}`);
  }
}

/**
 * Fetches a user's suspension/ban status by email.
 */
export async function fetchUserModerationStatus(
  email: string
): Promise<UserModerationRecord | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || isMainDeveloperEmail(cleanEmail)) return null;
  const emailKey = normalizeEmailKey(cleanEmail);
  try {
    const snap = await getDoc(doc(db, 'user_moderation', emailKey));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      id: snap.id,
      email: String(d.email || cleanEmail),
      displayName: String(d.displayName || ''),
      status: (d.status || 'active') as UserModerationStatus,
      reason: String(d.reason || ''),
      updatedByName: String(d.updatedByName || ''),
      updatedByUid: String(d.updatedByUid || ''),
      updatedAt: timestampToDate(d.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `user_moderation/${emailKey}`);
  }
}

/**
 * Suspends, bans, or restores a user atomically with an immutable audit log entry.
 */
export async function setUserModerationStatusWithAudit(input: {
  email: string;
  displayName: string;
  status: UserModerationStatus;
  reason: string;
}): Promise<void> {
  const actor = getActorMeta();
  const cleanEmail = clamp(input.email.toLowerCase(), 160);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please provide a valid user email address.');
  }
  const emailKey = normalizeEmailKey(cleanEmail);
  if (MAIN_DEVELOPER_EMAIL_KEYS.includes(emailKey) || isMainDeveloperEmail(cleanEmail)) {
    throw new Error('Main Developer accounts are permanently protected and cannot be suspended or banned.');
  }
  const cleanReason = clamp(input.reason, 500);
  if (cleanReason.length < 3) {
    throw new Error('Please enter a reason (at least 3 characters) for the audit trail.');
  }

  const auditAction: AdminAuditAction =
    input.status === 'banned'
      ? 'USER_BANNED'
      : input.status === 'suspended'
      ? 'USER_SUSPENDED'
      : 'USER_RESTORED';

  const auditId = safeId('audit');

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'user_moderation', emailKey), {
      email: cleanEmail,
      displayName: clamp(input.displayName || '', 120),
      status: input.status,
      reason: cleanReason,
      updatedByName: actor.actorName,
      updatedByUid: actor.uid,
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'audit_logs', auditId), {
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorName: actor.actorName,
      action: auditAction,
      target: cleanEmail,
      details: clamp(
        `Set account status to ${input.status.toUpperCase()} for ${cleanEmail}. Reason: ${cleanReason}`,
        1000
      ),
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `user_moderation/${emailKey}`);
  }
}

/**
 * Atomically revokes a user's role in role_assignments AND writes an immutable ROLE_REVOKED audit log.
 */
export async function revokeUserRoleWithAudit(input: {
  emailKey: string;
  email: string;
  previousRole: string;
  reason?: string;
}): Promise<void> {
  const actor = getActorMeta();
  if (MAIN_DEVELOPER_EMAIL_KEYS.includes(input.emailKey)) {
    throw new Error('Main Developer roles are permanent and cannot be revoked.');
  }
  const auditId = safeId('audit');
  const note = clamp(input.reason || 'Role revoked from Developer Admin Console', 500);

  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'role_assignments', input.emailKey));
    batch.set(doc(db, 'audit_logs', auditId), {
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorName: actor.actorName,
      action: 'ROLE_REVOKED',
      target: clamp(input.email.toLowerCase(), 160),
      details: clamp(
        `Revoked role "${input.previousRole}" from ${input.email}. Reason: ${note}`,
        1000
      ),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `role_assignments/${input.emailKey}`);
  }
}

// Guard against recursive or burst error logging
let isWritingErrorLog = false;
let lastErrorSignature = '';
let lastErrorAt = 0;

/**
 * Safely persists client/Firestore errors into Firestore error_logs for developer inspection.
 * Never throws so it cannot crash UI or loop recursively.
 */
export async function logSystemError(input: {
  source: SystemErrorSource;
  severity?: SystemErrorSeverity;
  message: string;
  path?: string;
  operation?: string;
  skipIfLockdown?: boolean;
}): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) return false;
  if (isWritingErrorLog || input.skipIfLockdown) return false;

  const cleanMessage = clamp(input.message || 'Unknown error', 1000);
  const cleanPath = clamp(input.path || window.location.pathname || '/', 200);
  const signature = `${input.source}|${cleanPath}|${cleanMessage.slice(0, 120)}`;
  const now = Date.now();
  if (signature === lastErrorSignature && now - lastErrorAt < 4000) {
    return false;
  }

  isWritingErrorLog = true;
  lastErrorSignature = signature;
  lastErrorAt = now;

  try {
    const errId = safeId('err');
    await setDoc(doc(db, 'error_logs', errId), {
      source: input.source,
      severity: input.severity || 'error',
      message: cleanMessage,
      path: cleanPath,
      operation: clamp(input.operation || 'runtime', 40),
      userUid: user.uid,
      userEmail: clamp(user.email.toLowerCase(), 160),
      resolved: false,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  } finally {
    isWritingErrorLog = false;
  }
}

/**
 * Developer-only: mark an error log resolved/unresolved with an audit trail entry.
 */
export async function toggleErrorLogResolvedWithAudit(
  errorId: string,
  nextResolved: boolean,
  errorSummary: string
): Promise<void> {
  const actor = getActorMeta();
  const auditId = safeId('audit');
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'error_logs', errorId), {
      resolved: Boolean(nextResolved),
    });
    batch.set(doc(db, 'audit_logs', auditId), {
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorName: actor.actorName,
      action: 'ERROR_LOG_RESOLVED',
      target: `error_logs/${errorId}`,
      details: clamp(
        `Marked error log ${errorId} as ${nextResolved ? 'RESOLVED' : 'OPEN'}: ${errorSummary}`,
        1000
      ),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `error_logs/${errorId}`);
  }
}

/**
 * Developer-only: delete an error log entry with an audit trail entry.
 */
export async function deleteErrorLogWithAudit(
  errorId: string,
  errorSummary: string
): Promise<void> {
  const actor = getActorMeta();
  const auditId = safeId('audit');
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'error_logs', errorId));
    batch.set(doc(db, 'audit_logs', auditId), {
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorName: actor.actorName,
      action: 'ERROR_LOG_DELETED',
      target: `error_logs/${errorId}`,
      details: clamp(`Deleted error log ${errorId}: ${errorSummary}`, 1000),
      createdAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `error_logs/${errorId}`);
  }
}
