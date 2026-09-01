import { Activity, ArrowRight, Building2, CalendarDays, ClipboardCheck, Cloud, FileCheck2, Leaf, Plus, ShieldAlert, UsersRound } from 'lucide-react'
import AppShell from '../../layouts/AppShell'
import { organizationNav } from '../../config/navigation'
import PageHeader from '../../components/dashboard/PageHeader'
import MetricCard from '../../components/ui/MetricCard'
import EmptyState from '../../components/ui/EmptyState'
import StatusPill from '../../components/ui/StatusPill'

export default function OrganizationDashboard() {
  return (
    <AppShell navItems={organizationNav} experience="Organization console" user={{ name: 'Navaneeth', role: 'Frontend preview' }}>
      <PageHeader eyebrow="Organization overview" title="Good evening, Navaneeth" description="Your ESG workspace begins with verified organizational activity. Add or import records to start measuring performance."
        actions={<><button className="hidden h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink-800 hover:bg-slate-50 sm:flex"><CalendarDays size={16} />This year</button><button className="flex h-10 items-center gap-2 rounded-xl bg-forest-800 px-4 text-sm font-semibold text-white hover:bg-forest-950"><Plus size={16} />Add record</button></>} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="ESG summary">
        <MetricCard label="Environmental score" value="Not calculated" helper="Insufficient verified data" icon={Leaf} tone="green" />
        <MetricCard label="Social score" value="Not calculated" helper="Insufficient verified data" icon={UsersRound} tone="blue" />
        <MetricCard label="Governance score" value="Not calculated" helper="Insufficient verified data" icon={FileCheck2} tone="violet" />
        <MetricCard label="Overall ESG score" value="Not calculated" helper="Awaiting module scores" icon={Activity} tone="amber" />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.7fr)]">
        <article className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <div><h2 className="text-sm font-semibold text-ink-950">ESG performance</h2><p className="mt-1 text-xs text-ink-600">Module score trend from verified records</p></div>
            <button className="text-xs font-semibold text-forest-700">View analytics</button>
          </div>
          <EmptyState icon={Activity} title="No performance data yet" description="Scores and trends will appear after your organization records sufficient verified ESG activity." />
        </article>

        <article className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4"><h2 className="text-sm font-semibold text-ink-950">Setup progress</h2><p className="mt-1 text-xs text-ink-600">Build your ESG foundation</p></div>
          <div className="space-y-1 p-3">
            {[
              { label: 'Organization profile', state: 'Ready', tone: 'green' },
              { label: 'Departments', state: 'Not started' },
              { label: 'Emission factors', state: 'Not started' },
              { label: 'ESG goals', state: 'Not started' },
            ].map((item, index) => <button key={item.label} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-canvas"><span className={`grid size-7 place-items-center rounded-lg text-xs font-bold ${index === 0 ? 'bg-forest-100 text-forest-800' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span><span className="flex-1 text-sm font-medium text-ink-800">{item.label}</span><StatusPill tone={item.tone}>{item.state}</StatusPill></button>)}
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <article className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-semibold">Environmental activity</h2><p className="mt-1 text-xs text-ink-600">Carbon transactions</p></div><span className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Cloud size={17} /></span></div>
          <EmptyState compact icon={Cloud} title="No carbon transactions" description="Connect operational data or add an authorized manual record." action="Open environmental" />
        </article>
        <article className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-semibold">Pending approvals</h2><p className="mt-1 text-xs text-ink-600">Submissions needing review</p></div><span className="rounded-lg bg-blue-50 p-2 text-blue-700"><ClipboardCheck size={17} /></span></div>
          <EmptyState compact icon={ClipboardCheck} title="All caught up" description="New CSR and challenge submissions will appear here." action="Open approval center" />
        </article>
        <article className="card overflow-hidden lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-semibold">Compliance watch</h2><p className="mt-1 text-xs text-ink-600">Open and overdue issues</p></div><span className="rounded-lg bg-violet-50 p-2 text-violet-700"><ShieldAlert size={17} /></span></div>
          <EmptyState compact icon={ShieldAlert} title="No compliance issues" description="Issues recorded from audits will be tracked here." action="Open governance" />
        </article>
      </section>

      <section className="mt-5 rounded-2xl border border-forest-100 bg-forest-50 p-5 sm:flex sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-forest-700 shadow-sm"><Building2 size={20} /></span><div><h2 className="text-sm font-semibold text-forest-950">Start with your organization foundation</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-forest-800/70">Add departments and configure master data before recording ESG activity. This keeps ownership and reporting scopes accurate.</p></div></div>
        <button className="mt-4 inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-forest-800 sm:ml-5 sm:mt-0">Continue setup<ArrowRight size={16} /></button>
      </section>
    </AppShell>
  )
}
