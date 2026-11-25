import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from 'firebase/storage';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  storage,
} from '../lib/firebase';
import { PortalUser, UserPrivateInfo, UserProfile, UserRole } from '../types';

// ============================================================================
// Profile service — users/{uid} (public) + users/{uid}/private/info (private)
// ============================================================================

function clamp(str: string, max: number): string {
  return (str || '').trim().slice(0, max);
}

function toDate(value: unknown): Date | null {
  if (value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>)) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

const VALID_ROLES: UserRole[] = [
  'developer',
  'chair',
  'ceo',
  'secretary',
  'lead1',
  'lead2',
  'lead3',
  'lead4',
  'lead5',
  'ca',
];

function asRole(value: unknown): UserRole | null {
  return typeof value === 'string' && (VALID_ROLES as string[]).includes(value)
    ? (value as UserRole)
    : null;
}

function mapProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    displayName: String(data.displayName || ''),
    photoURL: typeof data.photoURL === 'string' && data.photoURL ? data.photoURL : null,
    university: String(data.university || data.campus || ''),
    club: String(data.club || ''),
    position: String(data.position || ''),
    role: asRole(data.role),
    updatedAt: toDate(data.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Permission helpers (UI-level; Firestore rules enforce the same server-side)
// ---------------------------------------------------------------------------

function isLeadRole(role: UserRole | null | undefined): boolean {
  return Boolean(role && role.startsWith('lead'));
}

/**
 * Who may see phone / email / semester?
 * Only the profile owner, Chair and Secretary — plus the developer
 * (Tier 0 root, consistent with the rest of the system).
 * NOTE: CEO is intentionally NOT included here — the privacy spec lists
 * owner / Chair / Secretary only (developer added as Tier 0).
 * Callers must gate the actual Firestore fetch on this helper: never
 * fetch users/{uid}/private/info for a viewer who is not allowed to see it.
 */
export function canViewPrivateInfo(
  viewer: PortalUser | null,
  targetUid: string
): boolean {
  if (!viewer) return false;
  if (viewer.uid === targetUid) return true;
  return (
    viewer.role === 'developer' ||
    viewer.role === 'chair' ||
    viewer.role === 'secretary'
  );
}

/**
 * Who may edit a profile at all?
 * - Everyone edits only their own profile.
 * - Chair & Secretary can edit any user's profile.
 * - Developer (Tier 0) can edit any user's profile.
 * - CEO: given the same view/edit-other rights as Chair (existing Tier 1
 *   full-access parity), except role changes follow the subordinate-only /
 *   no-developer rule enforced by canChangeUserRole + the developer guard.
 * Field-level restriction: a Lead editing their OWN profile may only change
 * photo + position — see getProfileFieldAccess().
 */
export function canEditProfile(
  viewer: PortalUser | null,
  targetUid: string
): boolean {
  if (!viewer) return false;
  if (viewer.uid === targetUid) return true;
  return (
    viewer.role === 'developer' ||
    viewer.role === 'chair' ||
    viewer.role === 'secretary' ||
    viewer.role === 'ceo'
  );
}

export interface ProfileFieldAccess {
  canEdit: boolean;
  /** Lead viewing their own profile: only photo + position are editable. */
  leadSelfServiceOnly: boolean;
  canEditIdentityFields: boolean; // name / university / club
  canEditPosition: boolean;
  canEditPrivateFields: boolean; // phone / semester (email is always read-only)
}

export function getProfileFieldAccess(
  viewer: PortalUser | null,
  targetUid: string
): ProfileFieldAccess {
  const none: ProfileFieldAccess = {
    canEdit: false,
    leadSelfServiceOnly: false,
    canEditIdentityFields: false,
    canEditPosition: false,
    canEditPrivateFields: false,
  };
  if (!viewer || !canEditProfile(viewer, targetUid)) return none;

  const isOwn = viewer.uid === targetUid;
  if (isOwn && isLeadRole(viewer.role)) {
    // Leads can edit only their own photo and position details.
    return {
      canEdit: true,
      leadSelfServiceOnly: true,
      canEditIdentityFields: false,
      canEditPosition: true,
      canEditPrivateFields: false,
    };
  }

  return {
    canEdit: true,
    leadSelfServiceOnly: false,
    canEditIdentityFields: true,
    canEditPosition: true,
    canEditPrivateFields: canViewPrivateInfo(viewer, targetUid),
  };
}

/** Chair / Secretary / CEO / Developer may change roles (subject to the developer guard). */
export function canChangeUserRole(viewer: PortalUser | null): boolean {
  if (!viewer) return false;
  return (
    viewer.role === 'developer' ||
    viewer.role === 'chair' ||
    viewer.role === 'secretary' ||
    viewer.role === 'ceo'
  );
}

/** Roles the viewer is allowed to pick in a role dropdown (developer excluded unless viewer is developer). */
export function roleOptionsForViewer(viewer: PortalUser | null): UserRole[] {
  if (viewer?.role === 'developer') return [...VALID_ROLES];
  return VALID_ROLES.filter((r) => r !== 'developer');
}

/**
 * Developer-role guard: Chair / Secretary / CEO can never grant or remove
 * the "developer" role. Returns true when the given (current or incoming)
 * role is guarded for this viewer — i.e. the role control must be disabled
 * / the option excluded. Developers themselves are not guarded.
 */
export function isDeveloperRoleGuarded(
  viewer: PortalUser | null,
  role: UserRole | null | undefined
): boolean {
  if (!role || role !== 'developer') return false;
  return viewer?.role !== 'developer';
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return mapProfile(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

/**
 * Fetch users/{uid}/private/info.
 * IMPORTANT: callers MUST check canViewPrivateInfo() first and only call
 * this when it returns true — privacy is enforced by not fetching at all,
 * not by fetching and hiding.
 */
export async function fetchUserPrivateInfo(
  uid: string
): Promise<UserPrivateInfo | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'private', 'info'));
    if (!snap.exists()) return null;
    const d = snap.data() as Record<string, unknown>;
    return {
      phone: String(d.phone || ''),
      email: String(d.email || ''),
      semester: String(d.semester || ''),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}/private/info`);
  }
}

export async function listAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs
      .map((d) => mapProfile(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface SaveUserProfileInput {
  viewer: PortalUser;
  targetUid: string;
  publicFields: {
    displayName: string;
    university: string;
    club: string;
    position: string;
    photoURL?: string | null;
    /** Only honoured when canChangeUserRole(viewer) and the developer guard passes. */
    role?: UserRole | null;
  };
  /** Pass null to skip the private write entirely (viewer not allowed / not editing private fields). */
  privateFields: UserPrivateInfo | null;
}

export async function saveUserProfile(input: SaveUserProfileInput): Promise<void> {
  const { viewer, targetUid } = input;
  if (!canEditProfile(viewer, targetUid)) {
    throw new Error('You do not have permission to edit this profile.');
  }

  const access = getProfileFieldAccess(viewer, targetUid);

  const publicPayload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  // Leads editing themselves may only change position (+ photo via upload).
  if (!access.leadSelfServiceOnly) {
    publicPayload.displayName = clamp(input.publicFields.displayName, 120);
    publicPayload.university = clamp(input.publicFields.university, 120);
    publicPayload.club = clamp(input.publicFields.club, 120);
  }
  if (access.canEditPosition) {
    publicPayload.position = clamp(input.publicFields.position, 140);
  }
  if (typeof input.publicFields.photoURL !== 'undefined') {
    publicPayload.photoURL = input.publicFields.photoURL
      ? clamp(String(input.publicFields.photoURL), 1000)
      : null;
  }
  // Role changes: privileged viewers only, and never grant/remove
  // "developer" unless the viewer is a developer.
  if (
    input.publicFields.role != null &&
    canChangeUserRole(viewer) &&
    !isDeveloperRoleGuarded(viewer, input.publicFields.role)
  ) {
    publicPayload.role = input.publicFields.role;
  }

  try {
    await setDoc(doc(db, 'users', targetUid), publicPayload, { merge: true });

    if (input.privateFields && access.canEditPrivateFields) {
      await setDoc(
        doc(db, 'users', targetUid, 'private', 'info'),
        {
          phone: clamp(input.privateFields.phone, 40),
          // Email is read-only in the UI; it is stored so Chair/Secretary/
          // owner can see it in the private doc, but never edited by hand.
          email: clamp(input.privateFields.email.toLowerCase(), 160),
          semester: clamp(input.privateFields.semester, 60),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${targetUid}`);
  }
}

/** Role + position update used by the Manage Members table. */
export async function updateUserRoleAndPosition(input: {
  viewer: PortalUser;
  targetUid: string;
  currentRole: UserRole | null;
  role: UserRole;
  position: string;
}): Promise<void> {
  const { viewer, targetUid } = input;
  if (!canChangeUserRole(viewer)) {
    throw new Error('You do not have permission to change roles.');
  }
  // The guard applies to role CHANGES only: a developer's position may
  // still be edited, but their role can never be granted or removed here.
  if (
    input.role !== input.currentRole &&
    (isDeveloperRoleGuarded(viewer, input.role) ||
      isDeveloperRoleGuarded(viewer, input.currentRole))
  ) {
    throw new Error('Chair and Secretary can never grant or remove the "developer" role.');
  }
  try {
    await setDoc(
      doc(db, 'users', targetUid),
      {
        role: input.role,
        position: clamp(input.position, 140),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${targetUid}`);
  }
}

// ---------------------------------------------------------------------------
// Photo upload (Firebase Storage)
// ---------------------------------------------------------------------------

export const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;

const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_PHOTO_EXT = ['jpg', 'jpeg', 'png', 'webp'];

/** Returns a clear error message, or null when the file is acceptable. */
export function validateProfilePhotoFile(file: File): string | null {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_PHOTO_MIME.includes(file.type) || !ALLOWED_PHOTO_EXT.includes(ext)) {
    return 'Only JPG, PNG and WebP images are allowed. Please choose a different file.';
  }
  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    return `That image is ${(file.size / (1024 * 1024)).toFixed(1)} MB — the maximum is 2 MB. Please choose a smaller image.`;
  }
  if (file.size === 0) {
    return 'That file is empty. Please choose a different image.';
  }
  return null;
}

/**
 * Uploads a cropped square JPEG to profile-photos/{uid}.jpg (overwriting any
 * previous photo), then saves the download URL to users/{uid}.photoURL.
 * Photo upload is owner-only: callers must only invoke this for the
 * signed-in user's own uid (enforced here and in storage.rules).
 */
export async function uploadProfilePhoto(
  uid: string,
  blob: Blob,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('You can only upload a profile photo for your own account.');
  }
  if (blob.type && blob.type !== 'image/jpeg') {
    throw new Error('Profile photos must be saved as JPEG.');
  }
  if (blob.size > MAX_PROFILE_PHOTO_BYTES) {
    throw new Error('The cropped photo is larger than 2 MB. Please try again.');
  }

  const path = `profile-photos/${uid}.jpg`;
  const fileRef = storageRef(storage, path);
  const task = uploadBytesResumable(fileRef, blob, { contentType: 'image/jpeg' });

  const downloadURL = await new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      (error) => {
        reject(
          new Error(
            `Photo upload failed: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      },
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve, (error) =>
          reject(
            new Error(
              `Photo uploaded but its URL could not be read: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          )
        );
      }
    );
  });

  try {
    await setDoc(
      doc(db, 'users', uid),
      { photoURL: downloadURL, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }

  return downloadURL;
}
