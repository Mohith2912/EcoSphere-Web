export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-forest-700">{eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-[-0.04em] text-ink-950 sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
