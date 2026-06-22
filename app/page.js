import { verifySession, getDayData, getManagedActivities, getMonthSummary } from '@/app/lib/dal'
import { isValidDateString, todayString } from '@/app/lib/dates'
import { logoutAction } from '@/app/lib/actions'
import { Calendar } from '@/app/components/features/Calendar'
import { DayPanel } from '@/app/components/features/DayPanel'
import { ActivityManagerDrawer } from '@/app/components/features/ActivityManagerDrawer'
import { Button } from '@/app/components/ui/Button'
import { createServerClient } from '@/app/lib/supabase'

export default async function Home({ searchParams }) {
  const supabase = await createServerClient()
  const user = await verifySession(supabase)
  const params = await searchParams

  const today = todayString()
  const [currentYear, currentMonth] = today.split('-').map(Number)
  const requestedYear = typeof params.year === 'string' ? Number(params.year) : NaN
  const requestedMonth = typeof params.month === 'string' ? Number(params.month) : NaN
  const year = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
    ? requestedYear
    : currentYear
  const month = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
    ? requestedMonth
    : currentMonth

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`
  const requestedDate = isValidDateString(params.date) && params.date.startsWith(monthPrefix)
    ? params.date
    : null
  const selectedDate = requestedDate ?? (
    year === currentYear && month === currentMonth ? today : null
  )

  const [daysWithData, dayData, managedActivities] = await Promise.all([
    getMonthSummary(supabase, user.id, year, month),
    selectedDate ? getDayData(supabase, user.id, selectedDate) : Promise.resolve(null),
    getManagedActivities(supabase, user.id),
  ])

  return (
    <div className="flex min-h-dvh flex-col bg-surface-page">
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-sm font-bold text-white"
              aria-hidden="true"
            >
              R
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-text-primary sm:text-lg">
                Mi Rutina Diaria
              </h1>
              <p className="hidden text-xs text-text-tertiary sm:block">Tu ritmo, un día a la vez</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <ActivityManagerDrawer activities={managedActivities} today={today} />
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-10">
        <div className="mb-6 md:mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
            Bitácora diaria
          </p>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            Cuida lo importante de hoy.
          </h2>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.85fr)] lg:gap-6">
          <div className="min-w-0">
            {selectedDate && dayData ? (
              <DayPanel
                key={selectedDate}
                activities={dayData.activities}
                note={dayData.note}
                date={selectedDate}
                isToday={selectedDate === today}
                year={year}
                month={month}
              />
            ) : (
              <section className="rounded-2xl border border-border-default bg-surface-card p-7 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-brand-600">Explora tu ritmo</p>
                <h2 className="mb-2 text-2xl font-bold text-text-primary">Elige un día del calendario</h2>
                <p className="max-w-lg text-base text-text-secondary">
                  Consulta tus actividades, notas y progreso de cualquier fecha del mes.
                </p>
              </section>
            )}
          </div>

          <aside className="min-w-0" aria-label="Navegación por fecha">
            <Calendar
              initialYear={year}
              initialMonth={month}
              selectedDate={selectedDate}
              daysWithData={daysWithData}
            />
          </aside>
        </div>
      </main>
    </div>
  )
}
