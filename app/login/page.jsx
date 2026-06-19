import { LoginForm } from './LoginForm'

export const metadata = {
  title: 'Iniciar sesión — Mi Rutina Diaria',
}

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-surface-page px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.78fr)] lg:gap-6 lg:p-6">
      <section className="relative hidden overflow-hidden rounded-2xl bg-brand-700 p-10 text-white lg:flex lg:min-h-[calc(100dvh-3rem)] lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15 text-sm font-bold">R</span>
          <span className="font-semibold">Mi Rutina Diaria</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-200">Bitácora de ritmo personal</p>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
            Haz espacio para lo que quieres cuidar.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-brand-100">
            Organiza tus actividades, observa tu progreso y cierra cada día con una nota propia.
          </p>
        </div>

        <div className="relative h-16" aria-hidden="true">
          <div className="absolute inset-x-0 top-1/2 h-px bg-white/25" />
          {[8, 26, 47, 70, 91].map((left, index) => (
            <span
              key={left}
              className={`absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-brand-700 ${index < 3 ? 'bg-white' : 'bg-brand-400'}`}
              style={{ left: `${left}%` }}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col justify-center py-8 lg:min-h-0 lg:py-12">
        <div className="mb-10 lg:hidden">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-500 text-sm font-bold text-white">R</span>
            <span className="font-semibold text-text-primary">Mi Rutina Diaria</span>
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Tu ritmo diario</p>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary">Vuelve a lo importante.</h1>
        </div>

        <div className="rounded-2xl border border-border-default bg-surface-card p-6 shadow-sm sm:p-8">
          <p className="mb-2 text-sm font-semibold text-brand-600">Qué gusto verte</p>
          <h2 className="text-2xl font-bold text-text-primary">Inicia sesión</h2>
          <p className="mb-7 mt-2 text-base text-text-secondary">Continúa con las actividades que elegiste para ti.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
