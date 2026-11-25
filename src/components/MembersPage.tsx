import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Lock,
  Pencil,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { isMainDeveloperEmail, normalizeEmailKey } from '../lib/firebase';
import {
  canChangeUserRole,
  isDeveloperRoleGuarded,
  listAllUserProfiles,
  roleOptionsForViewer,
  updateUserRoleAndPosition,
} from '../services/profileService';
import {
  canEditRecruitmentLink,
  saveRecruitmentFormUrl,
  subscribeRecruitmentFormUrl,
} from '../services/recruitmentService';
import { ROLE_LABELS, upsertRoleAssignment } from '../services/portalService';
import {
  defaultPositionForRole,
  POSITION_OPTIONS,
  PortalDB,
  PortalUser,
  RoleAssignment,
  UserProfile,
  UserRole,
} from '../types';

interface MembersPageProps {
  currentUser: PortalUser | null;
  authLoading: boolean;
  portalData: PortalDB;
  onNavigateHome: () => void;
  onOpenProfile: (uid: string) => void;
  onNotify: (msg: string) => void;
}

interface MemberRow {
  key: string;
  /** null when the member only exists in role_assignments (no profile doc / uid unknown). */
  uid: string | null;
  displayName: string;
  email: string;
  photoURL: string | null;
  university: string;
  club: string;
  position: string;
  role: UserRole | null;
  hasProfile: boolean;
  assignment: RoleAssignment | null;
}

const cardClass =
  'bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl';
const selectClass =
  'bg-white dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-2 py-1.5 text-xs text-[#111318] dark:text-slate-100 disabled:opacity-60 focus:outline-none focus:border-[#B51B27] max-w-[190px]';

function canManageMembers(user: PortalUser | null): boolean {
  return Boolean(
    user &&
      user.emailVerified &&
      (user.role === 'chair' || user.role === 'secretary' || user.role === 'developer')
  );
}

export function MembersPage({
  currentUser,
  authLoading,
  portalData,
  onNavigateHome,
  onOpenProfile,
  onNotify,
}: MembersPageProps) {
  const allowed = canManageMembers(currentUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<{ key: string; kind: 'success' | 'warning' | 'error'; text: string } | null>(null);
  // Local overrides so dropdown changes reflect instantly.
  const [overrides, setOverrides] = useState<Record<string, { role: UserRole | null; position: string }>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading) return;
      if (!allowed) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const list = await listAllUserProfiles();
        if (!cancelled) setProfiles(list);
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadError('The member list could not be loaded. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
  }, [authLoading, allowed]);

  /**
   * Merge the users collection with role_assignments (passed in via
   * portalData, already loaded by App for full-access roles) so members who
   * have a role but no profile document yet still appear. Public profile
   * docs intentionally do not store email, so a profile is matched to its
   * assignment by normalised display name; unmatched assignments become
   * "No profile yet" rows whose uid is unknown.
   */
  const rows = useMemo<MemberRow[]>(() => {
    const assignmentByName = new Map<string, RoleAssignment>();
    for (const ra of portalData.roleAssignments) {
      const key = (ra.displayName || '').trim().toLowerCase();
      if (key && !assignmentByName.has(key)) assignmentByName.set(key, ra);
    }
    const matchedAssignmentIds = new Set<string>();

    const merged: MemberRow[] = profiles.map((p) => {
      const assignment = assignmentByName.get(p.displayName.trim().toLowerCase()) || null;
      if (assignment) matchedAssignmentIds.add(assignment.id);
      const override = overrides[p.uid];
      return {
        key: `uid_${p.uid}`,
        uid: p.uid,
        displayName: p.displayName || 'Unnamed member',
        email: assignment?.email || '',
        photoURL: p.photoURL,
        university: p.university || assignment?.campus || '',
        club: p.club,
        position: override?.position ?? (p.position || defaultPositionForRole(p.role)),
        role: override?.role ?? p.role ?? assignment?.role ?? null,
        hasProfile: true,
        assignment,
      };
    });

    for (const ra of portalData.roleAssignments) {
      if (matchedAssignmentIds.has(ra.id)) continue;
      const key = `email_${ra.id || normalizeEmailKey(ra.email)}`;
      const override = overrides[key];
      merged.push({
        key,
        uid: null,
        displayName: ra.displayName || ra.email,
        email: ra.email,
        photoURL: null,
        university: ra.campus || '',
        club: '',
        position: override?.position ?? defaultPositionForRole(ra.role),
        role: override?.role ?? ra.role,
        hasProfile: false,
        assignment: ra,
      });
    }

    // Developer accounts are visible only to developers. Chair and
    // Secretary never see developer rows in this list.
    const visible =
      currentUser?.role === 'developer'
        ? merged
        : merged.filter((r) => r.role !== 'developer' && !isMainDeveloperEmail(r.email));

    return visible.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [profiles, portalData.roleAssignments, overrides, currentUser]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.displayName, r.email, r.university, r.club, r.position, r.role ? ROLE_LABELS[r.role] : '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const handleRoleOrPositionChange = async (
    row: MemberRow,
    next: { role: UserRole; position: string }
  ) => {
    if (!currentUser) return;
    const isMainDevRow = isMainDeveloperEmail(row.email);
    if (isMainDevRow && next.role !== 'developer') {
      setRowMessage({
        key: row.key,
        kind: 'error',
        text: 'Primary developer accounts are permanently locked to the Platform Developer role.',
      });
      return;
    }
    if (next.role !== row.role && !canChangeUserRole(currentUser)) {
      setRowMessage({
        key: row.key,
        kind: 'error',
        text: 'Role changes are Chair/Developer only. You can still change the position.',
      });
      return;
    }
    if (
      next.role !== row.role &&
      (isDeveloperRoleGuarded(currentUser, next.role) ||
        isDeveloperRoleGuarded(currentUser, row.role))
    ) {
      setRowMessage({
        key: row.key,
        kind: 'error',
        text: 'Only a developer can grant or remove the "developer" role.',
      });
      return;
    }
    const previousOverride = overrides[row.key];
    setOverrides((prev) => ({ ...prev, [row.key]: { role: next.role, position: next.position } }));
    setBusyKey(row.key);
    setRowMessage(null);
    try {
      if (row.uid) {
        await updateUserRoleAndPosition({
          viewer: currentUser,
          targetUid: row.uid,
          currentRole: row.role,
          role: next.role,
          position: next.position,
        });
        setProfiles((prev) =>
          prev.map((p) =>
            p.uid === row.uid ? { ...p, role: next.role, position: next.position } : p
          )
        );
      }

      // Keep role_assignments in sync when we know the member's email.
      // For profile rows the email comes from the matched assignment; for
      // assignment-only rows the assignment itself is the record to update.
      const email = row.email || row.assignment?.email || '';
      // Position is not stored in role_assignments, so a sync is only
      // needed when the role itself changed.
      if (email && next.role !== row.role) {
        try {
          await upsertRoleAssignment({
            email,
            displayName: row.assignment?.displayName || row.displayName,
            role: next.role,
            squad: row.assignment?.squad || 'ALL',
            caCode: row.assignment?.caCode || '',
            campus: row.assignment?.campus || row.university || 'Ulterior Engineering',
          });
        } catch (syncErr) {
          // The users/{uid} write already succeeded — surface a warning
          // instead of crashing.
          console.error(syncErr);
          if (!row.uid) {
            setOverrides((prev) => {
              const copy = { ...prev };
              if (previousOverride) copy[row.key] = previousOverride;
              else delete copy[row.key];
              return copy;
            });
          }
          setRowMessage({
            key: row.key,
            kind: 'warning',
            text: row.uid
              ? 'Saved to the profile, but the role registry sync was rejected by the server rules.'
              : 'That role change was rejected by the server rules. Please check permissions and try again.',
          });
          onNotify(
            row.uid
              ? 'Member saved, but role registry sync was rejected.'
              : 'Role change was rejected by server rules.'
          );
          return;
        }
      }
      setRowMessage({ key: row.key, kind: 'success', text: 'Saved.' });
      onNotify(`Updated ${row.displayName}.`);
    } catch (err) {
      console.error(err);
      setOverrides((prev) => {
        const copy = { ...prev };
        if (previousOverride) copy[row.key] = previousOverride;
        else delete copy[row.key];
        return copy;
      });
      setRowMessage({
        key: row.key,
        kind: 'error',
        text: 'That change could not be saved. Please check your permissions and try again.',
      });
    } finally {
      setBusyKey(null);
    }
  };

  const chrome = (children: ReactNode) => (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100">
      <header className="sticky top-0 z-30 glass-panel border-b border-[#E2E5EB] dark:border-[#262B35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27] truncate">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>/members · Manage Members</span>
            </div>
            <div className="font-display font-extrabold text-sm sm:text-base text-[#111318] dark:text-white truncate">
              Member Management{' '}
              {currentUser && (
                <span className="font-normal text-xs text-[#5A6270] dark:text-slate-400">
                  ({currentUser.email})
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portal</span>
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">{children}</main>
    </div>
  );

  if (authLoading || loading) {
    return chrome(
      <div className={`${cardClass} p-6 space-y-3 animate-pulse`} aria-busy="true">
        <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-full rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-full rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  if (!allowed) {
    return chrome(
      <div className="max-w-lg mx-auto">
        <div className={`${cardClass} rounded-2xl p-8 space-y-4 text-center shadow-xl`}>
          <Lock className="w-8 h-8 text-[#B51B27] mx-auto" />
          <h1 className="font-display text-2xl font-extrabold text-[#111318] dark:text-white">
            Access denied
          </h1>
          <p className="text-sm text-[#5A6270] dark:text-slate-300 leading-relaxed">
            Manage Members is available only to the Chair, the Secretary and the developer.
            {currentUser
              ? ` You are signed in as ${currentUser.email} (${currentUser.role ? ROLE_LABELS[currentUser.role] : 'no role assigned'}).`
              : ' Please sign in with an authorised account.'}
          </p>
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 hover:border-[#B51B27] text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Public Portal
          </button>
        </div>
      </div>
    );
  }

  return chrome(
    <div className="space-y-5">
      {canEditRecruitmentLink(currentUser) && (
        <RecruitmentLinkCard currentUser={currentUser} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#111318] dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#B51B27]" /> Manage Members
          </h1>
          <p className="text-xs text-[#5A6270] dark:text-slate-400 mt-1">
            {rows.length} member{rows.length === 1 ? '' : 's'} · Role and position changes save
            immediately and stay in sync with the role registry when an email is known.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6270]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, university, club..."
            className="w-full bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#111318] dark:text-slate-100 focus:outline-none focus:border-[#B51B27]"
            aria-label="Search members"
          />
        </div>
      </div>

      {loadError && (
        <div role="alert" className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      <div className={`${cardClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-mono uppercase tracking-wide text-[#5A6270] dark:text-slate-400 border-b border-[#E2E5EB] dark:border-[#262B35]">
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">University / Club</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Position</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#5A6270] dark:text-slate-400">
                    {rows.length === 0
                      ? 'No members found yet. Profiles appear here once members save a profile or receive a role.'
                      : 'No members match your search.'}
                  </td>
                </tr>
              )}
              {filteredRows.map((row) => {
                const isMainDevRow = isMainDeveloperEmail(row.email);
                const guarded = isDeveloperRoleGuarded(currentUser, row.role);
                const canChangeRoles = canChangeUserRole(currentUser);
                const roleLocked = guarded || isMainDevRow || !canChangeRoles;
                const roleOpts = (() => {
                  const opts = roleOptionsForViewer(currentUser);
                  if (row.role && !opts.includes(row.role)) return [row.role, ...opts];
                  return opts;
                })();
                const positionOpts =
                  row.position && !POSITION_OPTIONS.includes(row.position)
                    ? [row.position, ...POSITION_OPTIONS]
                    : POSITION_OPTIONS;
                const busy = busyKey === row.key;
                return (
                  <tr
                    key={row.key}
                    className="border-b border-[#E2E5EB] dark:border-[#262B35] last:border-0 align-top"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        {row.photoURL ? (
                          <img
                            src={row.photoURL}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-[#E2E5EB] dark:border-[#262B35] shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#B51B27]/10 flex items-center justify-center shrink-0">
                            <UserRound className="w-4.5 h-4.5 text-[#B51B27]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-[#111318] dark:text-white truncate">
                            {row.displayName}
                          </div>
                          <div className="text-[11px] text-[#5A6270] dark:text-slate-400 truncate">
                            {row.email || 'Email unavailable'}
                          </div>
                          {!row.hasProfile && (
                            <span className="inline-block mt-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200">
                              No profile yet
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#5A6270] dark:text-slate-300">
                      <div>{row.university || '—'}</div>
                      <div className="text-[11px] text-[#5A6270] dark:text-slate-400">{row.club || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={selectClass}
                        value={row.role || 'ca'}
                        disabled={busy || roleLocked}
                        title={
                          isMainDevRow
                            ? 'Primary developer accounts are permanently locked to Platform Developer.'
                            : guarded
                              ? 'The developer role can never be granted or removed by Chair or Secretary.'
                              : !canChangeRoles
                                ? 'Role changes are Chair/Developer only.'
                                : undefined
                        }
                        onChange={(e) =>
                          void handleRoleOrPositionChange(row, {
                            role: e.target.value as UserRole,
                            position: row.position,
                          })
                        }
                        aria-label={`Role for ${row.displayName}`}
                      >
                        {roleOpts.map((opt) => (
                          <option key={opt} value={opt}>
                            {ROLE_LABELS[opt]}
                          </option>
                        ))}
                      </select>
                      {isMainDevRow && (
                        <p className="text-[10px] mt-1 text-[#5A6270] dark:text-slate-400 max-w-[190px]">
                          Primary developer — role locked.
                        </p>
                      )}
                      {!isMainDevRow && guarded && (
                        <p className="text-[10px] mt-1 text-[#5A6270] dark:text-slate-400 max-w-[190px]">
                          Developer role — locked for Chair/Secretary.
                        </p>
                      )}
                      {!guarded && !canChangeRoles && (
                        <p className="text-[10px] mt-1 text-[#5A6270] dark:text-slate-400 max-w-[190px]">
                          Role changes are Chair/Developer only.
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className={selectClass}
                        value={row.position}
                        disabled={busy || !row.hasProfile}
                        title={!row.hasProfile ? 'This member has no profile yet, so there is no profile document to save a position to.' : undefined}
                        onChange={(e) =>
                          void handleRoleOrPositionChange(row, {
                            role: (row.role || 'ca') as UserRole,
                            position: e.target.value,
                          })
                        }
                        aria-label={`Position for ${row.displayName}`}
                      >
                        {positionOpts.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={!row.uid}
                        title={!row.uid ? 'No profile yet — the member must sign in and save a profile before it can be opened.' : `Open ${row.displayName}'s profile`}
                        onClick={() => row.uid && onOpenProfile(row.uid)}
                        className="inline-flex items-center gap-1.5 bg-[#111318] hover:bg-[#B51B27] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      {rowMessage?.key === row.key && (
                        <p
                          role={rowMessage.kind === 'error' ? 'alert' : 'status'}
                          className={`mt-2 text-[11px] font-medium text-left max-w-[220px] ml-auto ${
                            rowMessage.kind === 'error'
                              ? 'text-red-700 dark:text-red-300'
                              : rowMessage.kind === 'warning'
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {rowMessage.text}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-[#5A6270] dark:text-slate-400 flex items-start gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Role changes are Chair/Developer only — the Secretary can change positions but not
        roles. The developer role never appears in these dropdowns for Chair or Secretary, and a
        developer&apos;s role cannot be changed here. Developer accounts are hidden from the
        Chair and the Secretary — only developers can see them. Private details (phone, email,
        semester) are never shown on this page.
      </p>
    </div>
  );
}


/** Editor for the recruitment Google Form link (Chair / Secretary / developer). */
function RecruitmentLinkCard({ currentUser }: { currentUser: PortalUser | null }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeRecruitmentFormUrl((url) => {
      setCurrentUrl(url);
      setDraft((prev) => (prev === '' ? url : prev));
    });
    return unsub;
  }, []);

  const handleSave = async () => {
    if (!currentUser || saving) return;
    setSaving(true);
    setNote(null);
    try {
      await saveRecruitmentFormUrl(draft, currentUser);
      setNote('Form link saved. Applicants will now see the new link.');
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Could not save the form link.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`${cardClass} p-5 space-y-3`}>
      <h2 className="text-sm font-bold text-[#111318] dark:text-white">
        Recruitment Google Form link
      </h2>
      <p className="text-[11px] text-[#5A6270] dark:text-slate-400 -mt-1">
        Shown to every applicant inside the application form. Only the Chair, the
        Secretary and the developer can change it. Current link:{' '}
        <span className="font-mono break-all">{currentUrl}</span>
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://forms.gle/…"
          className="flex-1 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5 text-sm text-[#111318] dark:text-slate-100 focus:outline-none focus:border-[#B51B27]"
          aria-label="Recruitment Google Form link"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !draft.trim() || draft.trim() === currentUrl}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#B51B27] hover:bg-[#92141E] disabled:opacity-50 text-white text-sm font-semibold cursor-pointer"
        >
          {saving ? 'Saving…' : 'Save link'}
        </button>
      </div>
      {note && <p className="text-[11px] text-[#5A6270] dark:text-slate-400">{note}</p>}
    </section>
  );
}
