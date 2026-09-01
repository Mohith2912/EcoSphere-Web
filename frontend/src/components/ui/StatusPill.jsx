export default function StatusPill({ children, tone = 'neutral' }) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}>{children}</span>
}
