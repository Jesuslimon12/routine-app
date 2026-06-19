export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10" aria-label="Cargando tu rutina">
      <div className="mb-8 h-20 max-w-xl animate-pulse rounded-2xl bg-neutral-100 motion-reduce:animate-none" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.85fr)] lg:gap-6">
        <div className="h-96 animate-pulse rounded-2xl border border-border-default bg-surface-card motion-reduce:animate-none" />
        <div className="h-96 animate-pulse rounded-2xl border border-border-default bg-surface-card motion-reduce:animate-none" />
      </div>
    </main>
  )
}
