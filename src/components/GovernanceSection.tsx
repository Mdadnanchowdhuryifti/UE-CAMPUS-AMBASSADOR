import { useState } from 'react';
import { ArrowUpRight, Lock } from 'lucide-react';
import { CORE_LEADS_LIST, GOVERNANCE_NODES } from '../data/playbook';
import { isRoleOpenForRecruitment } from '../services/portalService';
import { GovernanceNodeKey, RecruitmentStatusMap } from '../types';

interface GovernanceSectionProps {
  recruitmentStatus: RecruitmentStatusMap;
  onApply: (role: string) => void;
}

export function GovernanceSection({
  recruitmentStatus,
  onApply,
}: GovernanceSectionProps) {
  const [selectedKey, setSelectedKey] = useState<GovernanceNodeKey>('chair');
  const activeNode = GOVERNANCE_NODES[selectedKey];
  const isActiveNodeApplyOpen = isRoleOpenForRecruitment(
    recruitmentStatus,
    activeNode.applyRole
  );

  const getNodeClasses = (key: GovernanceNodeKey, emphasized = false) => {
    const isActive = selectedKey === key;
    return [
      'text-left rounded-lg transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2',
      emphasized ? 'border-2' : 'border',
      isActive
        ? 'border-[#B51B27] ring-3 ring-[#B51B27]/15 bg-white dark:bg-[#0D0F12]'
        : 'border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#0D0F12] hover:border-[#B51B27]',
    ].join(' ');
  };

  return (
    <section
      id="architecture"
      className="py-16 lg:py-20 border-b border-[#E2E5EB] dark:border-[#262B35]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-mono font-semibold text-[#B51B27]">
              01. Program Governance Architecture
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-[#111318] dark:text-white text-balance">
              Four-Tier Chain of Command. Zero Bottlenecks.
            </h2>
          </div>
          <p className="text-sm text-[#5A6270] dark:text-slate-400 max-w-md leading-relaxed">
            Select any tier or portfolio node below to inspect its exact mandate, reporting line,
            and monthly KPIs from the Ulterior Engineering Playbook.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Interactive Org Tree */}
          <div className="lg:col-span-8 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5 sm:p-7 swiss-grid">
            <div className="flex flex-col items-center">
              <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400 pb-1">
                Ulterior Engineering Management Interface
              </div>
              <div className="h-5 tree-line-v" aria-hidden="true" />

              {/* Tier 1: Program Chair */}
              <button
                type="button"
                onClick={() => setSelectedKey('chair')}
                className={`${getNodeClasses('chair', true)} w-full max-w-md p-4`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-semibold text-[#111318] dark:text-white">
                    Tier 1 · Strategic Head
                  </span>
                  <span className="font-mono text-[#B51B27]">
                    {selectedKey === 'chair' ? 'Inspecting' : 'Inspect'}
                  </span>
                </div>
                <div className="font-display font-bold text-base mt-1.5 text-[#111318] dark:text-white">
                  Program Chair (CA Lead)
                </div>
                <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-1">
                  Strategic alignment with Ulterior Engineering Management, KPI targets &amp;
                  approvals.
                </div>
              </button>

              <div className="h-6 tree-line-v" aria-hidden="true" />

              {/* Tier 2: Secretary */}
              <button
                type="button"
                onClick={() => setSelectedKey('secretary')}
                className={`${getNodeClasses('secretary', true)} w-full max-w-md p-4`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-semibold text-[#B51B27]">
                    Tier 2 · Executive Coordination
                  </span>
                  <span className="font-mono text-[#5A6270] dark:text-slate-400">
                    Reports to Chair
                  </span>
                </div>
                <div className="font-display font-bold text-base mt-1.5 text-[#111318] dark:text-white">
                  Program Secretary
                </div>
                <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-1">
                  Direct oversight of the 5 Core Team Leads, ExCom syncs, KPI audits &amp; central
                  governance.
                </div>
              </button>

              <div className="h-6 tree-line-v" aria-hidden="true" />

              {/* Horizontal connector */}
              <div
                className="w-full hidden sm:block h-[2px] bg-[#E2E5EB] dark:bg-[#262B35] max-w-2xl mb-4"
                aria-hidden="true"
              />

              {/* Tier 3: 5 Core Team Leads */}
              <div className="w-full">
                <div className="text-center text-xs font-mono text-[#5A6270] dark:text-slate-400 mb-3">
                  Tier 3 · Five Core Team Leads (ExCom Portfolios)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {CORE_LEADS_LIST.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => setSelectedKey(lead.id)}
                      className={`${getNodeClasses(lead.id)} p-3`}
                    >
                      <div className="text-[11px] font-mono text-[#B51B27] font-bold">
                        Lead {lead.num}
                      </div>
                      <div className="font-display font-bold text-xs mt-1 leading-snug text-[#111318] dark:text-white">
                        {lead.title}
                      </div>
                      <div className="text-[11px] text-[#5A6270] dark:text-slate-400 mt-1">
                        {lead.squad} Lead
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-6 tree-line-v" aria-hidden="true" />

              {/* Tier 4: General Campus Ambassadors */}
              <button
                type="button"
                onClick={() => setSelectedKey('general')}
                className={`${getNodeClasses('general')} w-full p-4`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                      Tier 4 · Nationwide Execution Force
                    </div>
                    <div className="font-display font-bold text-sm mt-1 text-[#111318] dark:text-white">
                      General Campus Ambassadors (Squads A – E)
                    </div>
                  </div>
                  <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                    Squad A · Squad B · Squad C · Squad D · Squad E
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Sticky Live Mandate & KPI Inspector */}
          <div className="lg:col-span-4 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-2 border-b border-[#E2E5EB] dark:border-[#262B35] pb-3 mb-4 text-xs font-mono">
              <span className="text-[#B51B27] font-semibold">{activeNode.tier}</span>
              <span className="text-[#5A6270] dark:text-slate-400">{activeNode.excom}</span>
            </div>

            <h3 className="font-display text-xl font-extrabold tracking-tight text-[#111318] dark:text-white">
              {activeNode.title}
            </h3>

            <div className="mt-5 space-y-4 text-sm leading-relaxed">
              <div>
                <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400 mb-1">
                  Direct Reporting Line
                </div>
                <p className="font-medium text-[#111318] dark:text-slate-100">
                  {activeNode.reporting}
                </p>
              </div>

              <div>
                <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400 mb-1">
                  Primary Mandate
                </div>
                <p className="text-[#5A6270] dark:text-slate-300">{activeNode.mandate}</p>
              </div>

              <div>
                <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400 mb-1.5">
                  Core Success Metrics (KPIs)
                </div>
                <ul className="space-y-1.5 text-xs text-[#111318] dark:text-slate-200">
                  {activeNode.kpis.map((kpi) => (
                    <li key={kpi} className="flex items-start gap-2">
                      <span className="text-[#B51B27] font-bold shrink-0" aria-hidden="true">
                        ▸
                      </span>
                      <span>{kpi}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E2E5EB] dark:border-[#262B35]">
                {isActiveNodeApplyOpen ? (
                  <button
                    type="button"
                    onClick={() => onApply(activeNode.applyRole)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#111318] dark:bg-white text-white dark:text-[#111318] hover:bg-[#B51B27] dark:hover:bg-[#B51B27] dark:hover:text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{activeNode.cta}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#E2E5EB] dark:bg-[#1E222B] text-[#5A6270] dark:text-slate-400 border border-[#D0D5DD] dark:border-[#2E3440] text-xs font-semibold py-2.5 px-4 rounded-lg cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Recruitment Closed</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
