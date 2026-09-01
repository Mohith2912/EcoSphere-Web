import { ArrowUpRight } from 'lucide-react'

const tones = {
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  violet: 'bg-violet-50 text-violet-700',
  amber: 'bg-amber-50 text-amber-700',
}

export default function MetricCard({ label, value, helper, icon: Icon, tone = 'green' }) {
  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon size={19} aria-hidden="true" />
        </span>
        <ArrowUpRight size={17} className="text-slate-300" aria-hidden="true" />
      </div>
      <p className="mt-5 text-sm font-medium text-ink-600">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-ink-950">{value}</p>
      <p className="mt-1.5 text-xs leading-5 text-ink-600">{helper}</p>
    </article>
  )
}
