import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PortalUser, UserRole } from '../types';
import { listAllUserProfiles } from './profileService';

// ============================================================================
// Announcements — posted by Chair / Secretary / CEO / Leads / developer.
// Every announcement appears in the app (bell icon) for all signed-in
// members, and the same message is emailed to every member through
// EmailJS (free tier). Fill in the three EmailJS values after creating a
// free EmailJS account, one email service and one template with the
// variables {{to_email}}, {{title}}, {{message}} and {{author_name}}.
// Until then, announcements still work in-app; email sending is skipped.
// ============================================================================

const EMAILJS_PUBLIC_KEY = 'EMAILJS_PUBLIC_KEY_PLACEHOLDER';
const EMAILJS_SERVICE_ID = 'EMAILJS_SERVICE_ID_PLACEHOLDER';
const EMAILJS_TEMPLATE_ID = 'EMAILJS_TEMPLATE_ID_PLACEHOLDER';

export function emailAnnouncementsConfigured(): boolean {
  return (
    !EMAILJS_PUBLIC_KEY.includes('PLACEHOLDER') &&
    !EMAILJS_SERVICE_ID.includes('PLACEHOLDER') &&
    !EMAILJS_TEMPLATE_ID.includes('PLACEHOLDER')
  );
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  authorUid: string;
  authorName: string;
  authorRole: UserRole | null;
  createdAt: Date | null;
}

const ANNOUNCE_ROLES: Array<UserRole> = [
  'developer',
  'chair',
  'ceo',
  'secretary',
  'lead1',
  'lead2',
  'lead3',
  'lead4',
  'lead5',
];

/** Chair, Secretary, CEO, Leads and the developer may post announcements. */
export function canAnnounce(user: PortalUser | null): boolean {
  return Boolean(user && user.role && ANNOUNCE_ROLES.includes(user.role));
}

/** Live subscription to the latest announcements (newest first). */
export function subscribeAnnouncements(
  onChange: (items: Announcement[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, 'announcements'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const rawDate = data.createdAt as { toDate?: () => Date } | null;
          return {
            id: d.id,
            title: String(data.title || ''),
            message: String(data.message || ''),
            authorUid: String(data.authorUid || ''),
            authorName: String(data.authorName || ''),
            authorRole: (data.authorRole as UserRole | null) || null,
            createdAt:
              rawDate && typeof rawDate.toDate === 'function'
                ? rawDate.toDate()
                : null,
          };
        })
      );
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

async function sendAnnouncementEmails(
  title: string,
  message: string,
  authorName: string
): Promise<number> {
  const profiles = await listAllUserProfiles();
  const emails = Array.from(
    new Set(
      profiles
        .map((p) => (p.email || '').trim().toLowerCase())
        .filter((e) => e.includes('@'))
    )
  );
  let sent = 0;
  for (const toEmail of emails) {
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: toEmail,
            title,
            message,
            author_name: authorName,
          },
        }),
      });
      if (res.ok) sent += 1;
    } catch {
      // A failed email must not fail the announcement itself.
    }
  }
  return sent;
}

/**
 * Posts an announcement to Firestore (appears in everyone's bell panel)
 * and emails the same message to all members when EmailJS is configured.
 * Returns how many emails were sent (0 when email is not configured).
 */
export async function postAnnouncement(input: {
  author: PortalUser;
  title: string;
  message: string;
}): Promise<{ emailedCount: number; emailConfigured: boolean }> {
  const title = input.title.trim().slice(0, 120);
  const message = input.message.trim().slice(0, 2000);
  if (!title || !message) {
    throw new Error('Please write both a title and a message.');
  }
  if (!canAnnounce(input.author)) {
    throw new Error('You do not have permission to post announcements.');
  }

  await addDoc(collection(db, 'announcements'), {
    title,
    message,
    authorUid: input.author.uid,
    authorName: input.author.displayName || input.author.email || 'Portal team',
    authorRole: input.author.role || null,
    createdAt: serverTimestamp(),
  });

  if (!emailAnnouncementsConfigured()) {
    return { emailedCount: 0, emailConfigured: false };
  }
  const emailedCount = await sendAnnouncementEmails(
    title,
    message,
    input.author.displayName || 'Portal team'
  );
  return { emailedCount, emailConfigured: true };
}
