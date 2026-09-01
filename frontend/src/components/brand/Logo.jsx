import { Leaf } from 'lucide-react'

export default function Logo({ compact = false, inverse = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${inverse ? 'bg-white text-forest-800' : 'bg-forest-800 text-white'}`}>
        <Leaf size={18} strokeWidth={2.4} aria-hidden="true" />
      </span>
      {!compact && (
        <span className={`text-[1.08rem] font-bold tracking-[-0.03em] ${inverse ? 'text-white' : 'text-ink-950'}`}>
          EcoSphere
        </span>
      )}
    </div>
  )
}
