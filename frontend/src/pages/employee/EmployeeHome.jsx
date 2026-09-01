import { Award, CalendarDays, ChevronRight, HandHeart, Leaf, Medal, ScrollText, Sparkles, Target, Trophy } from 'lucide-react'
import AppShell from '../../layouts/AppShell'
import { employeeNav } from '../../config/navigation'
import PageHeader from '../../components/dashboard/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import { useOverview } from '../../hooks/useOverview'

export default function EmployeeHome() {
  const { data } = useOverview()
  const progress = data?.gamification
  const quickActions = [
    { label: 'Explore CSR', description: 'Find activities to support', icon: HandHeart, tone: 'bg-blue-50 text-blue-700' },
    { label: 'View policies', description: 'Read assigned policies', icon: ScrollText, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Find challenges', description: 'Take meaningful action', icon: Target, tone: 'bg-amber-50 text-amber-700' },
  ]

  return (
    <AppShell navItems={employeeNav} experience="Employee portal" user={{ name: 'Navaneeth', role: 'Employee preview' }}>
      <PageHeader eyebrow="My EcoSphere" title="Make an impact, one action at a time" description="Discover initiatives, complete verified activities, and follow your sustainability journey." />

      <section className="relative overflow-hidden rounded-2xl bg-forest-950 px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="subtle-grid absolute inset-0 opacity-15" /><div className="absolute -right-16 -top-24 size-64 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <div><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100"><Sparkles size={13} />Your impact journey</span><h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em]">Ready when you are.</h2><p className="mt-2 max-w-lg text-sm leading-6 text-white/65">Your verified XP, badges, and participation will appear as you complete approved activities.</p></div>
          <div className="grid min-w-[260px] grid-cols-3 gap-2">
            {[["XP", progress?.xp ?? 0], ["Badges", progress?.badges?.length ?? 0], ["Activities", progress?.participations?.length ?? 0]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/8 p-3 text-center"><p className="text-xl font-bold">{value}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-white/50">{label}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {quickActions.map(({ label, description, icon: Icon, tone }) => <button key={label} className="card flex items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span><span className="flex-1"><span className="block text-sm font-semibold text-ink-950">{label}</span><span className="mt-1 block text-xs text-ink-600">{description}</span></span><ChevronRight size={17} className="text-slate-300" /></button>)}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6"><div><h2 className="text-sm font-semibold">Recommended for you</h2><p className="mt-1 text-xs text-ink-600">Available CSR activities and challenges</p></div><button className="text-xs font-semibold text-forest-700">View all</button></div>
          <EmptyState icon={Leaf} title="Nothing available yet" description="New activities and challenges published by your organization will show up here." />
        </article>
        <div className="grid gap-5">
          <article className="card overflow-hidden"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-semibold">Upcoming</h2><p className="mt-1 text-xs text-ink-600">Deadlines and events</p></div><CalendarDays size={18} className="text-forest-700" /></div><EmptyState compact icon={CalendarDays} title="No upcoming items" description="Deadlines will appear as you join activities." /></article>
          <article className="card overflow-hidden"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-semibold">Latest achievement</h2><p className="mt-1 text-xs text-ink-600">Badges from verified activity</p></div><Award size={18} className="text-amber-600" /></div><div className="flex min-h-36 items-center gap-4 px-5 py-5"><span className="grid size-12 place-items-center rounded-full border border-dashed border-amber-300 bg-amber-50 text-amber-600"><Medal size={20} /></span><div><p className="text-sm font-semibold text-ink-950">Your first badge awaits</p><p className="mt-1 text-xs leading-5 text-ink-600">Complete an eligible activity to begin.</p></div></div></article>
        </div>
      </section>

      <section className="mt-5 card flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><Trophy size={20} /></span><div className="flex-1"><h2 className="text-sm font-semibold">Leaderboard</h2><p className="mt-1 text-sm text-ink-600">No rankings available yet. Rankings begin after verified activity earns XP.</p></div><button className="text-sm font-semibold text-forest-700">How ranking works</button></section>
    </AppShell>
  )
}
