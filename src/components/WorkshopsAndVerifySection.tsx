import { FormEvent, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  XCircle,
} from 'lucide-react';
import { CertificateRecord, PortalDB, PortalUser, Workshop } from '../types';

interface WorkshopsAndVerifySectionProps {
  db: PortalDB;
  currentUser: PortalUser | null;
  readOnlyLockdown?: boolean;
  onRequireSignIn: () => Promise<void>;
  onSelectWorkshop: (ws: Workshop) => void;
  onVerifyCertificate: (id: string) => Promise<CertificateRecord | null>;
  onSubmitClubPitch: (pitch: {
    club: string;
    university: string;
    contact: string;
    type: string;
  }) => Promise<void>;
}

export function WorkshopsAndVerifySection({
  db,
  currentUser,
  readOnlyLockdown = false,
  onRequireSignIn,
  onSelectWorkshop,
  onVerifyCertificate,
  onSubmitClubPitch,
}: WorkshopsAndVerifySectionProps) {
  const [certQuery, setCertQuery] = useState('');
  const [certLoading, setCertLoading] = useState(false);
  const [checkedCert, setCheckedCert] = useState<{
    searchedId: string;
    record: CertificateRecord | null;
  } | null>(null);

  const [clubName, setClubName] = useState('');
  const [clubUniversity, setClubUniversity] = useState('');
  const [clubContact, setClubContact] = useState('');
  const [clubType, setClubType] = useState('Joint Technical Seminar');
  const [submittingClub, setSubmittingClub] = useState(false);

  const runCertCheck = async (rawId: string) => {
    const clean = rawId.trim().toUpperCase();
    if (!clean) return;
    setCertLoading(true);
    try {
      const found = await onVerifyCertificate(clean);
      setCheckedCert({ searchedId: clean, record: found });
    } finally {
      setCertLoading(false);
    }
  };

  const handleCertSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runCertCheck(certQuery);
  };

  const handleClubSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnlyLockdown) return;
    if (!currentUser) {
      await onRequireSignIn();
      return;
    }
    if (!clubName.trim() || !clubUniversity.trim() || !clubContact.trim()) return;
    setSubmittingClub(true);
    try {
      await onSubmitClubPitch({
        club: clubName.trim(),
        university: clubUniversity.trim(),
        contact: clubContact.trim(),
        type: clubType,
      });
      setClubName('');
      setClubUniversity('');
      setClubContact('');
      setClubType('Joint Technical Seminar');
    } finally {
      setSubmittingClub(false);
    }
  };

  return (
    <>
      {/* SECTION 05: WORKSHOPS */}
      <section
        id="workshops"
        className="py-16 lg:py-20 border-b border-[#E2E5EB] dark:border-[#262B35]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-mono font-semibold text-[#B51B27]">
                05. Workshops, Bootcamps &amp; Referral Engine
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-[#111318] dark:text-white text-balance">
                Flagship Technical Programs
              </h2>
            </div>
            <p className="text-sm text-[#5A6270] dark:text-slate-400 max-w-md leading-relaxed">
              Registrations using a Campus Ambassador referral link (
              <span className="font-mono text-[#B51B27]">?ref=CODE</span>) are saved in Cloud
              Firestore and routed to the Core Lead &amp; Secretary approval queue.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {db.workshops.map((ws) => {
              const pct = Math.min(100, Math.round((ws.regs / ws.seats) * 100));
              return (
                <article
                  key={ws.id}
                  className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 flex flex-col justify-between hover:border-[#B51B27] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-[#B51B27] font-semibold">{ws.tag}</span>
                      <span className="text-[#5A6270] dark:text-slate-400">{ws.date}</span>
                    </div>

                    <h3 className="font-display text-lg font-extrabold mt-3 leading-snug text-[#111318] dark:text-white">
                      {ws.title}
                    </h3>

                    <p className="text-xs text-[#5A6270] dark:text-slate-400 mt-2">
                      {ws.mode} ·{' '}
                      <strong className="font-semibold text-[#111318] dark:text-slate-200">
                        {ws.fee}
                      </strong>
                    </p>

                    <div className="mt-5">
                      <div className="flex justify-between text-xs font-mono tabular-nums text-[#5A6270] dark:text-slate-400 mb-1.5">
                        <span>
                          {ws.regs} / {ws.seats} seats filled
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F4F5F7] dark:bg-[#0D0F12] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#B51B27] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={readOnlyLockdown}
                    onClick={() => onSelectWorkshop(ws)}
                    className="mt-6 w-full inline-flex items-center justify-center gap-1.5 bg-[#111318] dark:bg-[#B51B27] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2.5 px-4 rounded-lg hover:bg-[#B51B27] dark:hover:bg-[#92141E] transition-colors cursor-pointer"
                  >
                    <span>
                      {readOnlyLockdown
                        ? 'Registration Paused (Lockdown)'
                        : 'Register with Referral Tracking'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 06: CERTIFICATE VERIFIER & CLUB COLLABORATION HUB */}
      <section id="verify" className="py-16 lg:py-20 bg-white dark:bg-[#15181E]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* 06A: Credential Verifier */}
            <div className="bg-[#F4F5F7] dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 sm:p-8">
              <div className="text-xs font-mono font-semibold text-[#B51B27]">
                06A. Live Cloud Credential Registry
              </div>
              <h3 className="font-display text-xl font-extrabold mt-1 text-[#111318] dark:text-white">
                LinkedIn-Verifiable Certificate Checker
              </h3>
              <p className="text-sm text-[#5A6270] dark:text-slate-400 mt-1.5 leading-relaxed">
                Verify official Ulterior Engineering Campus Ambassador completion certificates and
                Executive Committee credentials directly against the live database.
              </p>

              <form onSubmit={handleCertSubmit} className="mt-5 flex gap-2">
                <input
                  type="text"
                  value={certQuery}
                  onChange={(e) => setCertQuery(e.target.value)}
                  placeholder="Enter ID (e.g., UE-CA-2026-001)"
                  aria-label="Certificate ID"
                  required
                  className="flex-1 text-xs font-mono bg-white dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#B51B27]"
                />
                <button
                  type="submit"
                  disabled={certLoading}
                  className="bg-[#111318] dark:bg-[#B51B27] text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-[#B51B27] dark:hover:bg-[#92141E] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {certLoading ? 'Checking...' : 'Verify ID'}
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs font-mono text-[#5A6270] dark:text-slate-400">
                <span>Sample IDs:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCertQuery('UE-CA-2026-001');
                    void runCertCheck('UE-CA-2026-001');
                  }}
                  className="underline hover:text-[#B51B27] cursor-pointer"
                >
                  UE-CA-2026-001
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCertQuery('UE-EXCOM-2026-001');
                    void runCertCheck('UE-EXCOM-2026-001');
                  }}
                  className="underline hover:text-[#B51B27] cursor-pointer"
                >
                  UE-EXCOM-2026-001
                </button>
              </div>

              {checkedCert && (
                <div className="mt-5 pt-4 border-t border-[#E2E5EB] dark:border-[#262B35] text-xs">
                  {checkedCert.record && checkedCert.record.status === 'Valid' ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          Verified Credential
                        </span>
                        <span className="font-mono text-[#5A6270] dark:text-slate-400">
                          {checkedCert.record.id}
                        </span>
                      </div>
                      <div className="font-display text-base font-extrabold text-[#111318] dark:text-white">
                        {checkedCert.record.holder}
                      </div>
                      <div className="text-[#111318] dark:text-slate-200">
                        <strong className="font-semibold">Role:</strong> {checkedCert.record.role}
                      </div>
                      <div className="text-[#5A6270] dark:text-slate-400">
                        {checkedCert.record.campus} · Issued {checkedCert.record.issued}
                      </div>
                    </div>
                  ) : checkedCert.record && checkedCert.record.status === 'Revoked' ? (
                    <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Certificate {checkedCert.record.id} has been revoked by the Program Chair.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-semibold text-[#B51B27]">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>
                        No official credential found for ID &ldquo;{checkedCert.searchedId}&rdquo;.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 06B: Club Collaboration Pitch */}
            <div className="bg-[#F4F5F7] dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 sm:p-8">
              <div className="text-xs font-mono font-semibold text-[#B51B27]">
                06B. Campus Partnerships (Lead 5)
              </div>
              <h3 className="font-display text-xl font-extrabold mt-1 text-[#111318] dark:text-white">
                Pitch a Club Collaboration or Seminar
              </h3>
              <p className="text-sm text-[#5A6270] dark:text-slate-400 mt-1.5 leading-relaxed">
                Representing an IEEE Student Branch, Robotics Club, or EEE/CSE Society? Partner
                with Ulterior Engineering for technical seminars, hardware demos, or campus booths.
              </p>

              <form onSubmit={handleClubSubmit} className="mt-5 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Club / Society Name (e.g., IEEE NSU SB)"
                    aria-label="Club or Society Name"
                    required
                    className="text-xs bg-white dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#B51B27]"
                  />
                  <input
                    type="text"
                    value={clubUniversity}
                    onChange={(e) => setClubUniversity(e.target.value)}
                    placeholder="University / Institute"
                    aria-label="University or Institute"
                    required
                    className="text-xs bg-white dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#B51B27]"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={clubContact}
                    onChange={(e) => setClubContact(e.target.value)}
                    placeholder="Contact Person & Email / Phone"
                    aria-label="Contact Person and Email or Phone"
                    required
                    className="text-xs bg-white dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#B51B27]"
                  />
                  <select
                    aria-label="Collaboration Type"
                    value={clubType}
                    onChange={(e) => setClubType(e.target.value)}
                    className="text-xs bg-white dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#B51B27]"
                  >
                    <option value="Joint Technical Seminar">Joint Technical Seminar</option>
                    <option value="Hands-on Hardware / SCADA Workshop">
                      Hands-on Hardware / SCADA Workshop
                    </option>
                    <option value="Campus Booth & Tech Showcase">
                      Campus Booth &amp; Tech Showcase
                    </option>
                    <option value="FYDP Mentorship Session">FYDP Mentorship Session</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submittingClub || readOnlyLockdown}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  {readOnlyLockdown ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Submissions Paused (Emergency Lockdown)</span>
                    </>
                  ) : currentUser ? (
                    <>
                      <span>
                        {submittingClub
                          ? 'Submitting to Lead 5...'
                          : 'Submit Partnership Inquiry to Lead 5'}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sign in with Google to Submit Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
