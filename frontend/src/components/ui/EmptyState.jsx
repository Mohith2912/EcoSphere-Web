import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function EmptyState({ icon: Icon, title, description, action, actionHref, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'min-h-52 px-5 py-8' : 'min-h-72 px-6 py-12'}`}>
      <span className="mb-4 grid size-11 place-items-center rounded-xl border border-forest-100 bg-forest-50 text-forest-700">
        <Icon size={20} aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-ink-950">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-ink-600">{description}</p>
      {action && actionHref && (
        <Link to={actionHref} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-forest-700 hover:text-forest-800">
          {action}<ArrowRight size={15} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
