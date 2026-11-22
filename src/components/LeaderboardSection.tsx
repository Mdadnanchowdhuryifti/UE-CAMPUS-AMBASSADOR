import { useMemo, useState } from 'react';
import { Download, RefreshCw, Search } from 'lucide-react';
import { calcPoints, SQUAD_NAMES, SQUADS_META } from '../data/playbook';
import { PortalDB, SquadName } from '../types';

interface LeaderboardSectionProps {
  db: PortalDB;
  onOpenSheetSync: () => void;
  onExportCSV: () => void;
}

export function LeaderboardSection({
  db,
  onOpenSheetSync,
  onExportCSV,
}: LeaderboardSectionProps) {
  const [squadFilter, setSquadFilter] = useState<'ALL' | SquadName>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { rankedAll, topSquad, topCA, filtered } = useMemo(() => {
    const squadScores: Record<SquadName, number> = {
      'Squad A': 0,
      'Squad B': 0,
      'Squad C': 0,
      'Squad D': 0,
      'Squad E': 0,
    };

    db.roster.forEach((ca) => {
      squadScores[ca.squad] = (squadScores[ca.squad] || 0) + calcPoints(ca, db.kpiWeights);
    });

    const sortedSquads = (Object.entries(squadScores) as [SquadName, number][]).sort(
      (a, b) => b[1] - a[1]
    );

    const sortedRoster = [...db.roster].sort(
      (a, b) => calcPoints(b, db.kpiWeights) - calcPoints(a, db.kpiWeights)
    );

    const q = searchQuery.trim().toLowerCase();
    const list = sortedRoster.filter((ca) => {
      const matchSq = squadFilter === 'ALL' || ca.squad === squadFilter;
      const matchQ =
        !q ||
        ca.name.toLowerCase().includes(q) ||
        ca.campus.toLowerCase().includes(q) ||
        ca.code.toLowerCase().includes(q);
      return matchSq && matchQ;
    });

    return {
      rankedAll: sortedRoster,
      topSquad: sortedSquads[0],
      topCA: sortedRoster[0],
      filtered: list,
    };
  }, [db.roster, db.kpiWeights, squadFilter, searchQuery]);

  const w = db.kpiWeights;

  return (
    <section
      id="leaderboard"
      className="py-16 lg:py-20 bg-white dark:bg-[#15181E]/50 border-b border-[#E2E5EB] dark:border-[#262B35]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-mono font-semibold text-[#B51B27]">
              04. Live Performance Ledger
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-[#111318] dark:text-white text-balance">
              Monthly Squad &amp; Ambassador Leaderboard
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenSheetSync}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-[#F4F5F7] dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Google Sheet CSV</span>
            </button>
            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-[#F4F5F7] dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Monthly Log CSV</span>
            </button>
          </div>
        </div>

        {/* Spotlight Cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <div className="rounded-xl p-6 bg-[#111318] text-white border border-[#262B35] flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-semibold text-[#B51B27]">
                Squad of the Month
              </div>
              <div className="font-display text-xl font-extrabold mt-1">
                {topSquad ? topSquad[0] : 'Squad A'}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {topSquad ? SQUADS_META[topSquad[0]].cluster : ''}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-extrabold font-mono tabular-nums text-white">
                {topSquad ? topSquad[1] : 0}
              </div>
              <div className="text-xs text-slate-400">Combined Points</div>
            </div>
          </div>

          <div className="rounded-xl p-6 bg-[#F4F5F7] dark:bg-[#15181E] border border-[#B51B27]/35 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-semibold text-[#B51B27]">
                Top Ambassador Spotlight
              </div>
              <div className="font-display text-xl font-extrabold mt-1 text-[#111318] dark:text-white">
                {topCA ? topCA.name : '—'}
              </div>
              <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-0.5">
                {topCA ? `${topCA.campus} · ${topCA.squad} · ${topCA.code}` : '—'}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-extrabold font-mono tabular-nums text-[#B51B27]">
                {topCA ? calcPoints(topCA, w) : 0}
              </div>
              <div className="text-xs text-[#5A6270] dark:text-slate-400">Verified Points</div>
            </div>
          </div>
        </div>

        {/* Filter Bar & KPI Weight Legend */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by squad"
              value={squadFilter}
              onChange={(e) => setSquadFilter(e.target.value as 'ALL' | SquadName)}
              className="text-xs font-medium bg-[#F4F5F7] dark:bg-[#15181E] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2 focus:outline-none focus:border-[#B51B27]"
            >
              <option value="ALL">All Squads (A–E)</option>
              {SQUAD_NAMES.map((sq) => (
                <option key={sq} value={sq}>
                  {sq} · {SQUADS_META[sq].cluster.split('(')[0].trim()}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5A6270] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ambassador, campus, or code..."
                aria-label="Search leaderboard"
                className="text-xs bg-[#F4F5F7] dark:bg-[#15181E] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg pl-8 pr-3 py-2 w-64 focus:outline-none focus:border-[#B51B27]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono tabular-nums text-[#5A6270] dark:text-slate-400">
            <span>Reg +{w.workshopReg}</span>
            <span aria-hidden="true">·</span>
            <span>Tech Lead +{w.techLead}</span>
            <span aria-hidden="true">·</span>
            <span>Post +{w.brandPost}</span>
            <span aria-hidden="true">·</span>
            <span>Cert Min {w.certThreshold} pts</span>
          </div>
        </div>

        {/* High-Density Table */}
        <div className="overflow-x-auto bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E5EB] dark:border-[#262B35] bg-[#F4F5F7]/80 dark:bg-[#0D0F12]/70 font-mono text-[11px] text-[#5A6270] dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Rank</th>
                <th className="py-3 px-4 font-semibold">Ambassador</th>
                <th className="py-3 px-4 font-semibold">Campus</th>
                <th className="py-3 px-4 font-semibold">Squad</th>
                <th className="py-3 px-4 text-right font-semibold">Workshop Regs</th>
                <th className="py-3 px-4 text-right font-semibold">Tech Leads</th>
                <th className="py-3 px-4 text-right font-semibold">Brand Posts</th>
                <th className="py-3 px-4 text-right font-semibold">Total Points</th>
                <th className="py-3 px-4 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E5EB] dark:divide-[#262B35]">
              {filtered.length > 0 ? (
                filtered.map((ca) => {
                  const globalRank = rankedAll.findIndex((item) => item.id === ca.id) + 1;
                  const pts = calcPoints(ca, w);
                  const certReady = pts >= w.certThreshold;

                  return (
                    <tr
                      key={ca.id}
                      className="hover:bg-[#F4F5F7]/70 dark:hover:bg-[#0D0F12]/50 transition-colors"
                    >
                      <td
                        className={`py-3 px-4 font-mono font-bold tabular-nums ${
                          globalRank <= 3
                            ? 'text-[#B51B27]'
                            : 'text-[#5A6270] dark:text-slate-400'
                        }`}
                      >
                        #{globalRank}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#111318] dark:text-white">
                          {ca.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#5A6270] dark:text-slate-400">
                          {ca.code}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#5A6270] dark:text-slate-300">
                        {ca.campus}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#111318] dark:text-slate-200 whitespace-nowrap">
                        {ca.squad}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#111318] dark:text-slate-200">
                        {ca.workshopRegs}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#111318] dark:text-slate-200">
                        {ca.techLeads}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#111318] dark:text-slate-200">
                        {ca.brandPosts}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-sm tabular-nums text-[#111318] dark:text-white">
                        {pts}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            certReady
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {certReady ? 'Cert Eligible' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 px-4 text-center text-[#5A6270] dark:text-slate-400"
                  >
                    No ambassadors matched &ldquo;{searchQuery}&rdquo; in{' '}
                    {squadFilter === 'ALL' ? 'all squads' : squadFilter}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
