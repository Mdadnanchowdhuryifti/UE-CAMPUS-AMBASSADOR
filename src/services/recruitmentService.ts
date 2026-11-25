import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PortalUser } from '../types';

// ============================================================================
// Recruitment Google Form link.
// The portal keeps its own in-app application form; in addition, every
// applicant must complete the official Google Form. The form link lives in
// Firestore at config/recruitment so the Chair, Secretary and developer can
// change it from the Manage Members page without a redeploy. Until a link
// is saved there, the default below is used.
// ============================================================================

export const DEFAULT_RECRUITMENT_FORM_URL = 'https://forms.gle/kbPHTSWqkJBh5PRH7';

function sanitizeFormUrl(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_RECRUITMENT_FORM_URL;
  const url = value.trim();
  return url.startsWith('https://') && url.length <= 500
    ? url
    : DEFAULT_RECRUITMENT_FORM_URL;
}

/** Chair, Secretary and the developer may change the recruitment form link. */
export function canEditRecruitmentLink(user: PortalUser | null): boolean {
  return Boolean(
    user &&
      (user.role === 'developer' ||
        user.role === 'chair' ||
        user.role === 'secretary')
  );
}

/** Live subscription to the current recruitment form URL. */
export function subscribeRecruitmentFormUrl(
  onChange: (url: string) => void
): () => void {
  return onSnapshot(
    doc(db, 'config', 'recruitment'),
    (snap) => {
      onChange(
        snap.exists()
          ? sanitizeFormUrl((snap.data() as Record<string, unknown>).formUrl)
          : DEFAULT_RECRUITMENT_FORM_URL
      );
    },
    () => onChange(DEFAULT_RECRUITMENT_FORM_URL)
  );
}

/** Saves a new recruitment form URL (Chair / Secretary / developer only). */
export async function saveRecruitmentFormUrl(
  url: string,
  user: PortalUser
): Promise<void> {
  const cleaned = url.trim();
  if (!cleaned.startsWith('https://') || cleaned.length > 500) {
    throw new Error('Please enter a valid https:// form link.');
  }
  if (!canEditRecruitmentLink(user)) {
    throw new Error(
      'Only the Chair, the Secretary or a developer can change the form link.'
    );
  }
  await setDoc(doc(db, 'config', 'recruitment'), {
    formUrl: cleaned,
    updatedByUid: user.uid,
    updatedAt: serverTimestamp(),
  });
}
