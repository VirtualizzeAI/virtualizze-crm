interface PagePlaceholderProps {
  title: string
  description: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="rounded-xl border border-black/10 bg-white/85 p-8 shadow-panel backdrop-blur">
      <div className="space-y-3">
        <span className="inline-flex rounded-full bg-pine/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-pine">
          MVP scaffold
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="max-w-2xl text-sm leading-6 text-ink/70">{description}</p>
      </div>
    </section>
  )
}