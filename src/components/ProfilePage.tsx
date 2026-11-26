import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Camera,
  Trash2,
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  University,
  UserRound,
  Users,
} from 'lucide-react';
import { isMainDeveloperEmail } from '../lib/firebase';
import {
  canChangeUserRole,
  canViewPrivateInfo,
  fetchUserPrivateInfo,
  fetchUserProfile,
  getProfileFieldAccess,
  isDeveloperRoleGuarded,
  roleOptionsForViewer,
  saveUserProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  canChangeProfilePhoto,
  validateProfilePhotoFile,
} from '../services/profileService';
import { ROLE_LABELS } from '../services/portalService';
import {
  defaultPositionForRole,
  POSITION_OPTIONS,
  PortalUser,
  UserPrivateInfo,
  UserProfile,
  UserRole,
} from '../types';
import { useSearchParams } from 'react-router-dom';
import { ImageCropper } from './ImageCropper';

interface ProfilePageProps {
  currentUser: PortalUser | null;
  authLoading: boolean;
  onNavigateHome: () => void;
  onNavigateMembers?: () => void;
  onNotify: (msg: string) => void;
  onSignIn?: () => void;
}

const cardClass =
  'bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl';
const inputClass =
  'w-full bg-white dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5 text-sm text-[#111318] dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:border-[#B51B27]';
const labelClass =
  'block text-[11px] font-mono font-semibold uppercase tracking-wide text-[#5A6270] dark:text-slate-400 mb-1.5';

function parseTargetUid(
  currentUser: PortalUser | null,
  queryUid: string | null
): string | null {
  // With HashRouter the query string lives inside the hash, so it is read
  // through react-router's useSearchParams instead of window.location.search.
  if (queryUid && queryUid.trim()) return queryUid.trim();
  return currentUser?.uid ?? null;
}

export function ProfilePage({
  currentUser,
  authLoading,
  onNavigateHome,
  onNavigateMembers,
  onNotify,
  onSignIn,
}: ProfilePageProps) {
  const [searchParams] = useSearchParams();
  const queryUid = searchParams.get('uid');
  const targetUid = useMemo(
    () => parseTargetUid(currentUser, queryUid),
    [currentUser, queryUid]
  );
  const isOwn = Boolean(currentUser && targetUid && currentUser.uid === targetUid);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [privateInfo, setPrivateInfo] = useState<UserPrivateInfo | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [university, setUniversity] = useState('');
  const [club, setClub] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState<UserRole>('ca');
  const [phone, setPhone] = useState('');
  const [semester, setSemester] = useState('');
  const [emailDisplay, setEmailDisplay] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // Photo state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [photoMessage, setPhotoMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  const showPrivate = canViewPrivateInfo(currentUser, targetUid || '');
  const access = getProfileFieldAccess(currentUser, targetUid || '');
  const showRoleControl = Boolean(currentUser && canChangeUserRole(currentUser) && access.canEdit);
  const targetIsDeveloper = (profile?.role ?? (isOwn ? currentUser?.role : null)) === 'developer';
  const targetRole = profile?.role ?? (isOwn ? currentUser?.role ?? null : role ?? null);
  const canPhoto = Boolean(
    currentUser && targetUid && canChangeProfilePhoto(currentUser, targetUid, targetRole)
  );
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const isMainDevProfile = isMainDeveloperEmail(emailDisplay || (isOwn ? currentUser?.email : ''));
  const roleGuarded =
    isMainDevProfile ||
    isDeveloperRoleGuarded(currentUser, profile?.role ?? (isOwn ? currentUser?.role ?? null : null));
  const roleOptions = useMemo(() => {
    const opts = roleOptionsForViewer(currentUser);
    // Always keep the target's current role visible in the list.
    const current = profile?.role ?? (isOwn ? currentUser?.role : null);
    if (current && !opts.includes(current)) return [current, ...opts];
    return opts;
  }, [currentUser, profile?.role, isOwn]);

  const positionOptions = useMemo(() => {
    if (position && !POSITION_OPTIONS.includes(position)) return [position, ...POSITION_OPTIONS];
    return POSITION_OPTIONS;
  }, [position]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading) return;
      if (!currentUser || !targetUid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      setLoadWarning(null);

      const prefillFromAccount = () => {
        // Empty state: no profile doc yet — prefill from the account
        // (for another user we only know their uid, so fields stay blank).
        setProfile(null);
        setProfileExists(false);
        setDisplayName(isOwn ? currentUser.displayName || '' : '');
        setUniversity(isOwn ? currentUser.campus || '' : '');
        setClub('');
        setPosition(defaultPositionForRole(isOwn ? currentUser.role : null));
        setRole((isOwn ? currentUser.role : null) || 'ca');
        setPhotoURL(isOwn ? currentUser.photoURL : null);
        setPrivateInfo(null);
        setPhone('');
        setSemester('');
        setEmailDisplay(isOwn ? currentUser.email : '');
      };

      const isPermissionError = (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        return (
          msg.includes('permission-denied') ||
          msg.includes('PERMISSION_DENIED') ||
          msg.includes('Missing or insufficient permissions')
        );
      };

      try {
        let rulesBlocked = false;
        try {
          const fetched = await fetchUserProfile(targetUid);
          if (cancelled) return;
          if (fetched) {
            setProfile(fetched);
            setProfileExists(true);
            setDisplayName(fetched.displayName);
            setUniversity(fetched.university);
            setClub(fetched.club);
            setPosition(fetched.position || defaultPositionForRole(fetched.role));
            setRole(fetched.role || 'ca');
            setPhotoURL(fetched.photoURL);
            setEmailDisplay(fetched.email || '');
            setSemester(fetched.semester || '');
          } else {
            prefillFromAccount();
          }
        } catch (err) {
          if (cancelled) return;
          if (!isPermissionError(err)) throw err;
          // The live Firestore rules do not include the users rules yet
          // (default-deny blocks the read). Don't dead-end: for your own
          // profile, fall back to the account-prefilled form with a clear
          // warning; saving will also fail until the rules are published.
          rulesBlocked = true;
          console.error(err);
          if (!isOwn) {
            setLoadError(
              'Profile access is blocked by the live Firestore security rules. Publish the updated firestore.rules for this database in the Firebase Console, then try again.'
            );
            return;
          }
          prefillFromAccount();
        }

        // PRIVACY GATE: the private document is fetched ONLY when the
        // viewer is allowed to see it (owner / Chair / Secretary /
        // developer). For everyone else it is never requested at all.
        if (canViewPrivateInfo(currentUser, targetUid)) {
          try {
            const priv = await fetchUserPrivateInfo(targetUid);
            if (cancelled) return;
            setPrivateInfo(priv);
            setPhone(priv?.phone || '');
            // Legacy fallback: profiles saved before email/semester became
            // public fields may only have them in the private document.
            setSemester((prev) => prev || priv?.semester || '');
            setEmailDisplay(
              (prev) => prev || priv?.email || (isOwn ? currentUser.email : '')
            );
          } catch (err) {
            if (cancelled) return;
            console.error(err);
            // Private info unavailable (e.g. rules not published yet) —
            // keep the public profile usable and just warn.
            rulesBlocked = true;
            setPrivateInfo(null);
            setPhone('');
          }
        } else {
          // Signed-out viewer: no phone (it is never fetched), but the
          // public email/semester loaded above stay visible.
          setPrivateInfo(null);
          setPhone('');
        }

        if (rulesBlocked && !cancelled) {
          setLoadWarning(
            'Your saved profile could not be reached — the live Firestore security rules for this database do not include the profile rules yet. Publish the updated firestore.rules in the Firebase Console for the ai-studio database, then reload. Until then, this form shows your account details and saving may fail.'
          );
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError('This profile could not be loaded. Please try again.');
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentUser?.uid, targetUid]);

  // ------------------------- Photo handling -------------------------
  const handleFileChosen = (file: File | null) => {
    if (!file) return;
    setPhotoMessage(null);
    const error = validateProfilePhotoFile(file);
    if (error) {
      setPhotoMessage({ kind: 'error', text: error });
      return;
    }
    setCropFile(file);
  };

  const handleCropped = async (blob: Blob) => {
    if (!currentUser) return;
    setCropFile(null);
    setPhotoMessage(null);
    setUploadProgress(0);
    try {
      const url = await uploadProfilePhoto(currentUser, targetUid || currentUser.uid, targetRole, blob, (pct) =>
        setUploadProgress(pct)
      );
      setPhotoURL(url);
      setProfile((prev) => (prev ? { ...prev, photoURL: url } : prev));
      setPhotoMessage({ kind: 'success', text: 'Profile photo updated.' });
      onNotify('Profile photo updated.');
    } catch (err) {
      setPhotoMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Photo upload failed. Please try again.',
      });
    } finally {
      setUploadProgress(null);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser || !targetUid) return;
    setRemovingPhoto(true);
    setPhotoMessage(null);
    try {
      await removeProfilePhoto(currentUser, targetUid, targetRole);
      setPhotoURL(null);
      setProfile((prev) => (prev ? { ...prev, photoURL: null } : prev));
      setPhotoMessage({ kind: 'success', text: 'Profile photo removed.' });
      onNotify('Profile photo removed.');
    } catch (err) {
      setPhotoMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Could not remove the photo. Please try again.',
      });
    } finally {
      setRemovingPhoto(false);
    }
  };

  // ------------------------- Save handling -------------------------
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !targetUid || !access.canEdit) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await saveUserProfile({
        viewer: currentUser,
        targetUid,
        publicFields: {
          displayName,
          university,
          club,
          position,
          role: showRoleControl ? role : undefined,
        },
        privateFields:
          access.canEditPrivateFields && showPrivate
            ? {
                phone,
                email: emailDisplay || (isOwn ? currentUser.email : ''),
                semester,
              }
            : null,
      });
      setProfileExists(true);
      setSaveMessage({ kind: 'success', text: 'Profile saved.' });
      onNotify('Profile saved.');
    } catch (err) {
      console.error(err);
      setSaveMessage({
        kind: 'error',
        text: 'Profile could not be saved. You may not have permission for that change, or the connection dropped. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // ------------------------- Page chrome -------------------------
  const chrome = (children: ReactNode) => (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100">
      <header className="sticky top-0 z-30 glass-panel border-b border-[#E2E5EB] dark:border-[#262B35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27] truncate">
              <UserRound className="w-3.5 h-3.5 shrink-0" />
              <span>/profile · {isOwn ? 'My Profile' : 'Member Profile'}</span>
            </div>
            <div className="font-display font-extrabold text-sm sm:text-base text-[#111318] dark:text-white truncate">
              {isOwn ? 'My Profile' : displayName || 'Member Profile'}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigateMembers &&
              currentUser &&
              (currentUser.role === 'chair' ||
                currentUser.role === 'secretary' ||
                currentUser.role === 'developer') && (
                <button
                  type="button"
                  onClick={onNavigateMembers}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-[#B51B27]" />
                  <span>Manage Members</span>
                </button>
              )}
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portal</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">{children}</main>
    </div>
  );

  // ------------------------- Gates -------------------------
  if (authLoading) {
    return chrome(
      <div className="max-w-3xl mx-auto space-y-4" aria-busy="true">
        <div className={`${cardClass} p-6 flex items-center gap-4 animate-pulse`}>
          <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <div className={`${cardClass} p-6 space-y-3 animate-pulse`}>
          <div className="h-3 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return chrome(
      <div className="max-w-md mx-auto">
        <div className={`${cardClass} rounded-2xl p-8 space-y-5 shadow-xl text-center`}>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27]">
            <LogIn className="w-4 h-4" />
            <span>/profile · Sign In Required</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#111318] dark:text-white">
            Sign in to view your profile
          </h1>
          <p className="text-sm text-[#5A6270] dark:text-slate-300 leading-relaxed">
            Profiles are only available to signed-in portal members. Sign in with Google to view
            and edit your profile.
          </p>
          <div className="space-y-2.5 pt-1">
            {onSignIn && (
              <button
                type="button"
                onClick={onSignIn}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full inline-flex items-center justify-center gap-1.5 border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 hover:border-[#B51B27] text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Portal</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return chrome(
      <div className="max-w-3xl mx-auto space-y-4" aria-busy="true">
        <div className={`${cardClass} p-6 flex items-center gap-4 animate-pulse`}>
          <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <div className={`${cardClass} p-6 space-y-3 animate-pulse`}>
          <div className="h-3 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return chrome(
      <div className="max-w-md mx-auto">
        <div className={`${cardClass} rounded-2xl p-8 space-y-4 text-center`}>
          <AlertTriangle className="w-8 h-8 text-[#B51B27] mx-auto" />
          <p className="text-sm text-[#5A6270] dark:text-slate-300">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Another user with no profile doc yet — clean empty state.
  if (!profileExists && !isOwn && !access.canEdit) {
    return chrome(
      <div className="max-w-md mx-auto">
        <div className={`${cardClass} rounded-2xl p-8 space-y-4 text-center`}>
          <UserRound className="w-8 h-8 text-[#B51B27] mx-auto" />
          <h1 className="font-display text-xl font-extrabold text-[#111318] dark:text-white">
            No profile yet
          </h1>
          <p className="text-sm text-[#5A6270] dark:text-slate-300">
            This member hasn&apos;t created a profile yet, so there is nothing public to show.
          </p>
        </div>
      </div>
    );
  }

  const effectiveRole: UserRole | null =
    profile?.role ?? (isOwn ? currentUser.role : null) ?? (showRoleControl ? role : null);
  const tierLabel = effectiveRole ? ROLE_LABELS[effectiveRole] : 'Unassigned';

  return chrome(
    <div className="max-w-3xl mx-auto space-y-5">
      {loadWarning && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-900 dark:text-red-200 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadWarning}</span>
        </div>
      )}

      {!profileExists && (
        <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {isOwn
              ? 'No profile saved yet — the form below is prefilled from your account. Save it to create your profile.'
              : 'This member has no profile document yet. Saving will create one for them.'}
          </span>
        </div>
      )}

      {access.leadSelfServiceOnly && (
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-[#E2E5EB] dark:border-[#262B35] text-xs text-[#5A6270] dark:text-slate-300 flex items-start gap-2">
          <Lock className="w-4 h-4 shrink-0 mt-0.5 text-[#B51B27]" />
          <span>
            As a Lead, you can update your own photo and position details here. Other fields are
            managed by the Chair, Secretary or Developer.
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Photo + identity summary */}
        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="relative shrink-0 mx-auto sm:mx-0">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName || 'Profile photo'}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border border-[#E2E5EB] dark:border-[#262B35]"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#B51B27]/10 border border-[#E2E5EB] dark:border-[#262B35] flex items-center justify-center">
                  <UserRound className="w-10 h-10 text-[#B51B27]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#111318] dark:text-white truncate">
                {displayName || 'Unnamed member'}
              </h1>
              <p className="text-sm text-[#5A6270] dark:text-slate-300">
                {position || 'General Campus Ambassador'}
                {club ? ` · ${club}` : ''}
                {university ? ` · ${university}` : ''}
              </p>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#B51B27]">
                <BadgeCheck className="w-3.5 h-3.5" />
                {tierLabel}
              </p>

              {/* Photo add/remove — owner, developer (anyone), CEO/Chair (Secretary down to CA, never the developer). */}
              {canPhoto ? (
                <div className="pt-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      handleFileChosen(e.target.files?.[0] ?? null);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadProgress !== null}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 bg-[#111318] hover:bg-[#B51B27] disabled:opacity-60 dark:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {uploadProgress !== null ? 'Uploading...' : photoURL ? 'Change photo' : 'Add photo'}
                  </button>
                  {photoURL && (
                    <button
                      type="button"
                      disabled={removingPhoto || uploadProgress !== null}
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 ml-2 bg-transparent border border-[#D0D5DD] dark:border-[#2E3440] hover:border-red-400 hover:text-red-600 disabled:opacity-60 text-[#5A6270] dark:text-slate-300 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {removingPhoto ? 'Removing...' : 'Remove photo'}
                    </button>
                  )}
                  <p className="text-[11px] text-[#5A6270] dark:text-slate-400">
                    JPG, PNG or WebP, up to 2 MB. You&apos;ll crop it to a square before saving.
                  </p>
                  {uploadProgress !== null && (
                    <div className="max-w-xs mx-auto sm:mx-0">
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-[#B51B27] transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[11px] mt-1 text-[#5A6270] dark:text-slate-400">
                        Uploading… {uploadProgress}%
                      </p>
                    </div>
                  )}
                  {photoMessage && (
                    <p
                      role={photoMessage.kind === 'error' ? 'alert' : 'status'}
                      className={`text-xs font-medium ${
                        photoMessage.kind === 'error'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {photoMessage.text}
                    </p>
                  )}
                </div>
              ) : (
                <p className="pt-1 text-[11px] text-[#5A6270] dark:text-slate-400 inline-flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  You don&apos;t have permission to change this photo.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Public fields */}
        <section className={`${cardClass} p-5 sm:p-6 space-y-4`}>
          <h2 className="text-sm font-bold text-[#111318] dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#B51B27]" /> Public profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-name" className={labelClass}>
                Full name
              </label>
              <input
                id="profile-name"
                className={inputClass}
                value={displayName}
                disabled={!access.canEditIdentityFields}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={120}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label htmlFor="profile-university" className={labelClass}>
                University
              </label>
              <div className="relative">
                <University className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6270]" />
                <input
                  id="profile-university"
                  className={`${inputClass} pl-9`}
                  value={university}
                  disabled={!access.canEditIdentityFields}
                  onChange={(e) => setUniversity(e.target.value)}
                  maxLength={120}
                  placeholder="Your university"
                />
              </div>
            </div>
            <div>
              <label htmlFor="profile-club" className={labelClass}>
                Club
              </label>
              <input
                id="profile-club"
                className={inputClass}
                value={club}
                disabled={!access.canEditIdentityFields}
                onChange={(e) => setClub(e.target.value)}
                maxLength={120}
                placeholder="e.g. IEEE Student Branch"
              />
            </div>
            <div>
              <label htmlFor="profile-position" className={labelClass}>
                Position
              </label>
              <select
                id="profile-position"
                className={inputClass}
                value={position}
                disabled={!access.canEditPosition}
                onChange={(e) => setPosition(e.target.value)}
              >
                {positionOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tier (from role — read-only)</label>
              <div className={`${inputClass} bg-slate-50 dark:bg-slate-800/40 flex items-center`}>
                <span className="truncate">{tierLabel}</span>
              </div>
            </div>
            {showRoleControl && (
              <div>
                <label htmlFor="profile-role" className={labelClass}>
                  Role
                </label>
                <select
                  id="profile-role"
                  className={inputClass}
                  value={role}
                  disabled={roleGuarded}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  {roleOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {ROLE_LABELS[opt]}
                    </option>
                  ))}
                </select>
                {isMainDevProfile && (
                  <p className="text-[11px] mt-1.5 text-[#5A6270] dark:text-slate-400">
                    Primary developer account — role is permanently locked to Platform Developer.
                  </p>
                )}
                {!isMainDevProfile && roleGuarded && targetIsDeveloper && (
                  <p className="text-[11px] mt-1.5 text-[#5A6270] dark:text-slate-400">
                    This user has the developer role. Only a developer can grant or
                    remove the developer role.
                  </p>
                )}
                {!roleGuarded && currentUser.role !== 'developer' && (
                  <p className="text-[11px] mt-1.5 text-[#5A6270] dark:text-slate-400">
                    The developer role is not available in this list — only a developer can grant
                    or remove it.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Contact details — email + semester are public; the phone number
            is visible to signed-in members only and is fetched only for them. */}
        {(
          <section className={`${cardClass} p-5 sm:p-6 space-y-4`}>
            <h2 className="text-sm font-bold text-[#111318] dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#B51B27]" /> Contact details
            </h2>
            <p className="text-[11px] text-[#5A6270] dark:text-slate-400 -mt-2">
              Email and semester are public. The phone number is visible to signed-in
              members only.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-email" className={labelClass}>
                  Email (read-only)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6270]" />
                  <input
                    id="profile-email"
                    className={`${inputClass} pl-9 bg-slate-50 dark:bg-slate-800/40`}
                    value={emailDisplay}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              {showPrivate ? (
              <div>
                <label htmlFor="profile-phone" className={labelClass}>
                  Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6270]" />
                  <input
                    id="profile-phone"
                    className={`${inputClass} pl-9`}
                    value={phone}
                    disabled={!access.canEditPrivateFields}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={40}
                    placeholder="+880…"
                    inputMode="tel"
                  />
                </div>
              </div>
              ) : (
              <div>
                <label className={labelClass}>Phone</label>
                <p className="text-xs text-[#5A6270] dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5">
                  Sign in to view the phone number.
                </p>
              </div>
              )}
              <div>
                <label htmlFor="profile-semester" className={labelClass}>
                  Semester
                </label>
                <input
                  id="profile-semester"
                  className={inputClass}
                  value={semester}
                  disabled={!access.canEditPrivateFields}
                  onChange={(e) => setSemester(e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Spring 2026, 7th semester"
                />
              </div>
            </div>
          </section>
        )}

        {access.canEdit ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] disabled:opacity-60 text-white text-sm font-semibold px-5 py-3 rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save profile'}
            </button>
            {saveMessage && (
              <p
                role={saveMessage.kind === 'error' ? 'alert' : 'status'}
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  saveMessage.kind === 'error'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {saveMessage.kind === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                {saveMessage.text}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#5A6270] dark:text-slate-400 inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            You can view this public profile, but only the owner, Chair, Secretary or developer can
            edit it.
          </p>
        )}
      </form>

      {cropFile && (
        <ImageCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(blob) => void handleCropped(blob)}
        />
      )}
    </div>
  );
}
